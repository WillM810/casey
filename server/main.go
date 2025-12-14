package main

import (
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env if it exists (local dev convenience)
	_ = godotenv.Load()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080" // Cloud Run sets PORT automatically
	}

	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/", canonicalMiddleware(fs))

	http.HandleFunc("/robots.txt", dynamicRobots)
	http.HandleFunc("/sitemap.xml", dynamicSiteMap)
	http.HandleFunc("/contact-me", handleContactForm())

	log.Printf("Listening on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
