package main

import (
	"fmt"
	"net/http"
)

func dynamicRobots(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain")

	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}

	baseURL := fmt.Sprintf("%s://%s",
		scheme,
		r.Host,
	)

	fmt.Fprintf(w, "User-agent: *\n"+
		"Allow: /\n"+
		"Disallow: /*_8fa8a5df\n"+
		"Sitemap: %s/sitemap.xml\n",
		baseURL)
}
