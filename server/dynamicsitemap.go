package main

import (
	"encoding/xml"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

type UrlSet struct {
	XMLName xml.Name `xml:"urlset"`
	Xmlns   string   `xml:"xmlns,attr"`
	Urls    []Url    `xml:"url"`
}

type Url struct {
	Loc     string `xml:"loc"`
	LastMod string `xml:"lastmod,omitempty"`
}

func dynamicSiteMap(w http.ResponseWriter, r *http.Request) {
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}

	baseURL := scheme + "://" + r.Host

	var urls []Url
	err := filepath.Walk("./public", func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}
		if strings.HasSuffix(path, "_8fa8a5df.html") {
			return nil
		}
		if strings.HasSuffix(info.Name(), ".html") {
			relPath := strings.TrimPrefix(path, "public")
			relPath = strings.ReplaceAll(relPath, "\\", "/")
			loc := baseURL + relPath
			lastMod := info.ModTime().Format("2006-01-02")
			urls = append(urls, Url{Loc: loc, LastMod: lastMod})
		}

		return nil
	})

	if err != nil {
		http.Error(w, "Failed to read public folder", http.StatusInternalServerError)
		log.Println("Error walking public folder", err)
		return
	}

	sitemap := UrlSet{
		Xmlns: "http://www.sitemaps.org/schemas/sitemap/0.9",
		Urls:  urls,
	}

	w.Header().Set("Content-Type", "application/xml")
	enc := xml.NewEncoder(w)
	enc.Indent("", "  ")
	if err := enc.Encode(sitemap); err != nil {
		http.Error(w, "Failed to generate sitemap", http.StatusInternalServerError)
		log.Println("Error encoding sitemap", err)
	}
}
