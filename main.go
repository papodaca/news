package main

import "github.com/papodaca/news/migrations"

func main() {
	err := migrations.RunMigrations()

	if err != nil {
		return
	}
}
