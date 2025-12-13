package main

import (
	"fmt"
	"log"
	"net/http"
	"net/smtp"
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

	// Read SMTP config from environment variables
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPassword := os.Getenv("SMTP_PASSWORD")
	toEmail := os.Getenv("TO_EMAIL")
	autoEmail := os.Getenv("AUTO_EMAIL")

	// Validate required env vars on startup
	if smtpHost == "" || smtpPort == "" || smtpUser == "" ||
		smtpPassword == "" || toEmail == "" || autoEmail == "" {

		log.Fatal("Missing one or more required SMTP environment variables")
	}

	fs := http.FileServer(http.Dir("./public"))
	http.Handle("/", fs)

	http.HandleFunc("/contact-me", func(w http.ResponseWriter, r *http.Request) {
		if r.Method == http.MethodGet {
			http.ServeFile(w, r, "./public/contact-me/index.html")
			return
		}

		if r.Method != http.MethodPost {
			http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
			return
		}

		name := r.FormValue("rp_name")
		email := r.FormValue("rp_email")
		phone := r.FormValue("rp_subject")

		if name == "" || email == "" || phone == "" {
			http.Redirect(w, r, "/contact-me?success=2", http.StatusFound)
			return
		}

		body := fmt.Sprintf(
			"From: %s\n"+
				"Reply-To: %s <%s>"+
				"To: %s\n"+
				"Subject: Website Contact Form Submission\n\n"+
				"Name: %s\n"+
				"Email: %s\n"+
				"Phone: %s\n",
			autoEmail, name, email, toEmail, name, email, phone,
		)

		auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)

		err := smtp.SendMail(smtpHost+":"+smtpPort, auth, smtpUser,
			[]string{toEmail}, []byte(body))

		if err != nil {
			log.Println("SMTP error:", err)
			http.Redirect(w, r, "/contact-me?success=3", http.StatusFound)
			return
		}

		http.Redirect(w, r, "/contact-me?success=1", http.StatusFound)
	})

	log.Printf("Listening on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
