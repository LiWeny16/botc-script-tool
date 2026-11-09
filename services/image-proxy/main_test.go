package main

import (
	"net/http"
	"net/http/httptest"
	"net/netip"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestPublicAddressChecks(t *testing.T) {
	for _, tc := range []struct {
		addr string
		ok   bool
	}{
		{"8.8.8.8", true}, {"2606:4700:4700::1111", true}, {"127.0.0.1", false},
		{"10.0.0.1", false}, {"192.168.1.1", false}, {"100.64.0.1", false},
		{"169.254.169.254", false}, {"::1", false}, {"::ffff:127.0.0.1", false},
		{"fe80::1", false}, {"fd00::1", false}, {"203.0.113.1", false},
		{"64:ff9b::7f00:1", false}, {"2002:7f00:1::1", false},
	} {
		if got := publicIP(netip.MustParseAddr(tc.addr)); got != tc.ok {
			t.Errorf("%s: got %v", tc.addr, got)
		}
	}
}

func TestURLAndOriginValidation(t *testing.T) {
	for _, raw := range []string{"http://127.0.0.1/secret", "https://example.com:22/a", "file:///etc/passwd", "https://user:pass@example.com/a"} {
		u, err := url.Parse(raw)
		if err == nil && validateURL(u) == nil {
			t.Errorf("accepted %q", raw)
		}
	}
	if !allowedOrigin("https://botc.letshare.fun") || !allowedOrigin("http://localhost:5173") || allowedOrigin("https://evil.example") || allowedOrigin("") {
		t.Fatal("origin validation failed")
	}
}

func TestProxyRejectsUnsafeAndNonImages(t *testing.T) {
	p := newProxy()
	for _, raw := range []string{"http://127.0.0.1/", "http://169.254.169.254/latest/meta-data", "https://example.com:22/"} {
		r := httptest.NewRequest(http.MethodGet, "/?url="+url.QueryEscape(raw), nil)
		r.Header.Set("Origin", "https://botc.letshare.fun")
		w := httptest.NewRecorder()
		p.ServeHTTP(w, r)
		if w.Code != http.StatusBadRequest {
			t.Errorf("%s: %d", raw, w.Code)
		}
	}
	if imageType([]byte("<html>not an image</html>")) != "" || imageType([]byte("<svg onload='alert(1)'></svg>")) != "" {
		t.Fatal("non-image content accepted")
	}
	if imageType([]byte("\x89PNG\r\n\x1a\nrest")) != "image/png" {
		t.Fatal("PNG rejected")
	}
}

func TestRateLimit(t *testing.T) {
	p := newProxy()
	now := time.Now()
	for i := 0; i < 300; i++ {
		if !p.allowRequest("client", now) {
			t.Fatal("limited too early")
		}
	}
	if p.allowRequest("client", now) || !p.allowRequest("client", now.Add(time.Minute)) {
		t.Fatal("rate limit did not reset")
	}
	if !strings.Contains(http.StatusText(http.StatusTooManyRequests), "Many") {
		t.Fatal("unexpected status")
	}
}
