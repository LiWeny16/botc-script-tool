// botc-image-proxy fetches public image URLs for the script image exporter.
// It deliberately listens only on loopback; the HTTPS reverse proxy is the
// public entry point. It must never be used as a general-purpose HTTP proxy.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/netip"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"
)

const maxImageBytes = 12 << 20

var blockedNetworks = []netip.Prefix{
	netip.MustParsePrefix("0.0.0.0/8"), netip.MustParsePrefix("100.64.0.0/10"),
	netip.MustParsePrefix("192.0.0.0/24"), netip.MustParsePrefix("192.0.2.0/24"),
	netip.MustParsePrefix("198.18.0.0/15"), netip.MustParsePrefix("198.51.100.0/24"),
	netip.MustParsePrefix("203.0.113.0/24"), netip.MustParsePrefix("240.0.0.0/4"),
	netip.MustParsePrefix("64:ff9b::/96"), netip.MustParsePrefix("64:ff9b:1::/48"),
	netip.MustParsePrefix("2001::/32"), netip.MustParsePrefix("2001:db8::/32"), netip.MustParsePrefix("2002::/16"),
}

func publicIP(ip netip.Addr) bool {
	ip = ip.Unmap()
	if !ip.IsValid() || !ip.IsGlobalUnicast() || ip.IsPrivate() || ip.IsLoopback() || ip.IsLinkLocalUnicast() {
		return false
	}
	for _, block := range blockedNetworks {
		if block.Contains(ip) {
			return false
		}
	}
	return true
}

func validateURL(u *url.URL) error {
	if u == nil || (u.Scheme != "http" && u.Scheme != "https") || u.Hostname() == "" || u.User != nil {
		return errors.New("invalid image URL")
	}
	if p := u.Port(); p != "" && p != "80" && p != "443" {
		return errors.New("port is not permitted")
	}
	if ip, err := netip.ParseAddr(u.Hostname()); err == nil && !publicIP(ip) {
		return errors.New("address is not public")
	}
	return nil
}

func publicDial(ctx context.Context, network, address string) (net.Conn, error) {
	host, port, err := net.SplitHostPort(address)
	if err != nil {
		return nil, err
	}
	addresses, err := net.DefaultResolver.LookupNetIP(ctx, "ip", host)
	if err != nil || len(addresses) == 0 {
		return nil, errors.New("image host cannot be resolved")
	}
	// Reject mixed public/private responses as well as DNS rebinding attempts.
	for _, ip := range addresses {
		if !publicIP(ip) {
			return nil, errors.New("image host resolves to a restricted address")
		}
	}
	dialer := net.Dialer{Timeout: 5 * time.Second}
	var last error
	for _, ip := range addresses {
		conn, err := dialer.DialContext(ctx, network, net.JoinHostPort(ip.String(), port))
		if err == nil {
			return conn, nil
		}
		last = err
	}
	return nil, last
}

func allowedOrigin(origin string) bool {
	if origin == "" {
		return false
	}
	u, err := url.Parse(origin)
	if err != nil || u.User != nil || u.Path != "" || u.RawQuery != "" || u.Fragment != "" {
		return false
	}
	if u.Scheme == "https" && (u.Host == "botc.letshare.fun" || u.Host == "liweny16.github.io") {
		return true
	}
	return u.Scheme == "http" && (u.Hostname() == "localhost" || u.Hostname() == "127.0.0.1")
}

type window struct {
	since time.Time
	count int
}
type imageProxy struct {
	client  *http.Client
	slots   chan struct{}
	mu      sync.Mutex
	clients map[string]window
}

func newProxy() *imageProxy {
	transport := &http.Transport{Proxy: nil, DialContext: publicDial, DisableKeepAlives: true,
		TLSHandshakeTimeout: 6 * time.Second, ResponseHeaderTimeout: 12 * time.Second}
	return &imageProxy{slots: make(chan struct{}, 24), clients: make(map[string]window), client: &http.Client{
		Timeout: 20 * time.Second, Transport: transport,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 4 {
				return errors.New("too many redirects")
			}
			return validateURL(req.URL)
		},
	}}
}

func (p *imageProxy) allowRequest(key string, now time.Time) bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	// Keep the in-memory table bounded even for a public endpoint.
	if len(p.clients) > 4096 {
		for k, v := range p.clients {
			if now.Sub(v.since) >= time.Minute {
				delete(p.clients, k)
			}
		}
	}
	if len(p.clients) > 8192 {
		return false
	}
	w := p.clients[key]
	if w.since.IsZero() || now.Sub(w.since) >= time.Minute {
		w = window{since: now}
	}
	w.count++
	p.clients[key] = w
	return w.count <= 300
}

func imageType(data []byte) string {
	t := http.DetectContentType(data)
	switch t {
	case "image/png", "image/jpeg", "image/gif", "image/webp", "image/bmp", "image/x-icon":
		return t
	}
	if len(data) >= 12 && string(data[4:8]) == "ftyp" && (string(data[8:12]) == "avif" || string(data[8:12]) == "avis") {
		return "image/avif"
	}
	return ""
}

func (p *imageProxy) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if !allowedOrigin(r.Header.Get("Origin")) {
		http.Error(w, "origin not allowed", http.StatusForbidden)
		return
	}
	w.Header().Set("Access-Control-Allow-Origin", r.Header.Get("Origin"))
	w.Header().Set("Vary", "Origin")
	w.Header().Set("X-Content-Type-Options", "nosniff")
	if r.Method == http.MethodOptions {
		w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	ip := r.Header.Get("X-Real-IP")
	if ip == "" {
		ip, _, _ = net.SplitHostPort(r.RemoteAddr)
	}
	if !p.allowRequest(ip, time.Now()) {
		http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
		return
	}
	raw := r.URL.Query().Get("url")
	if len(raw) == 0 || len(raw) > 4096 {
		http.Error(w, "invalid image URL", http.StatusBadRequest)
		return
	}
	u, err := url.Parse(raw)
	if err != nil || validateURL(u) != nil {
		http.Error(w, "invalid image URL", http.StatusBadRequest)
		return
	}
	select {
	case p.slots <- struct{}{}:
		defer func() { <-p.slots }()
	default:
		http.Error(w, "busy", http.StatusServiceUnavailable)
		return
	}
	req, err := http.NewRequestWithContext(r.Context(), http.MethodGet, u.String(), nil)
	if err != nil {
		http.Error(w, "invalid image URL", http.StatusBadRequest)
		return
	}
	req.Header.Set("Accept", "image/avif,image/webp,image/png,image/jpeg,image/gif,image/*;q=0.8")
	resp, err := p.client.Do(req)
	if err != nil {
		http.Error(w, "image could not be fetched", http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK || resp.ContentLength > maxImageBytes {
		http.Error(w, "image unavailable or too large", http.StatusBadGateway)
		return
	}
	data, err := io.ReadAll(io.LimitReader(resp.Body, maxImageBytes+1))
	if err != nil || len(data) > maxImageBytes {
		http.Error(w, "image unavailable or too large", http.StatusBadGateway)
		return
	}
	mime := imageType(data)
	if mime == "" {
		http.Error(w, "unsupported image type", http.StatusUnsupportedMediaType)
		return
	}
	w.Header().Set("Content-Type", mime)
	w.Header().Set("Cache-Control", "private, max-age=3600")
	w.Header().Set("Content-Length", fmt.Sprint(len(data)))
	_, _ = w.Write(data)
}

func main() {
	address := "127.0.0.1:18087"
	if v := os.Getenv("BOTC_IMAGE_PROXY_LISTEN"); v != "" && strings.HasPrefix(v, "127.0.0.1:") {
		address = v
	}
	server := &http.Server{Addr: address, Handler: newProxy(), ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 15 * time.Second, MaxHeaderBytes: 16 << 10}
	log.Printf("BOTC image proxy listening on %s", address)
	log.Fatal(server.ListenAndServe())
}
