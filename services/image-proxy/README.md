# BOTC image export proxy

The browser exporter requests this service only for public image URLs that
cannot be read directly. The Go service binds to `127.0.0.1:18087`; the
existing HTTPS vhost includes `nginx-location.conf` and exposes
`/botc-image-proxy?url=...`.

The service accepts GET/OPTIONS from the production site, the GitHub Pages
origin, and localhost development. It re-resolves and pins every destination
and redirect to public IPs, restricts ports and image types, caps size,
timeouts, concurrency and request rate, and does not log image URLs. The
reverse-proxy location disables access logs because image URLs can contain
tokens. This service does not fetch credentials or receive script content.

Run `go test ./...` and `go build` before deployment. Install the executable
under `/opt/botc-image-proxy/`, the systemd unit under `/etc/systemd/system/`,
and the location snippet under `/etc/nginx/snippets/ecs.zingspark.tech/`.
Include the location in the existing HTTPS server block only; validate with
`nginx -t` before reloading Nginx. Never add a duplicate vhost for the domain.
