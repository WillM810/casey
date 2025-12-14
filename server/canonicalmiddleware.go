package main

import (
	"bytes"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
)

// canonicalMiddleware wraps the file server
func canonicalMiddleware(next http.Handler) http.Handler {
	canonicalHost := os.Getenv("CANONICAL_HOST")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only intercept HTML pages
		if strings.HasSuffix(r.URL.Path, ".html") || r.URL.Path == "/" {
			// Capture the original response
			buf := &bytes.Buffer{}
			mw := &responseWriter{ResponseWriter: w, buf: buf}

			next.ServeHTTP(mw, r)

			// Inject canonical tag
			scheme := "https"
			if r.TLS == nil {
				scheme = "http"
			}
			canonical := scheme + "://" + canonicalHost + r.URL.Path
			html := buf.String()
			if idx := strings.Index(html, "</head>"); idx != -1 {
				// Find the last line break before </head>
				lastNewline := strings.LastIndex(html[:idx-1], "\n")
				var indent strings.Builder
				if lastNewline != -1 {
					// Capture the whitespace on the line before </head>
					line := html[lastNewline+1 : idx]
					for _, r := range line {
						if r == ' ' || r == '\t' {
							indent.WriteString(string(r))
						} else {
							break
						}
					}
				}

				// Build canonical tag using existing indentation
				tag := "\n" + indent.String() + `<link rel="canonical" href="` + canonical + `">` + "\n"
				html = html[:idx] + tag + html[idx:]
			}

			// Send modified HTML
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.Header().Set("Content-Length", strconv.Itoa(len(html)))
			w.WriteHeader(mw.status)
			io.WriteString(w, html)
			return
		}

		// For non-HTML, just serve normally
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture output
type responseWriter struct {
	http.ResponseWriter
	buf    *bytes.Buffer
	status int
}

func (rw *responseWriter) Write(b []byte) (int, error) {
	return rw.buf.Write(b)
}

func (rw *responseWriter) WriteHeader(statusCode int) {
	rw.status = statusCode
}
