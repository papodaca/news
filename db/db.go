package db

import (
	"github.com/jmoiron/sqlx"

	_ "github.com/mattn/go-sqlite3"
)

var db *sqlx.DB

func initDb() (*sqlx.DB, error) {
	dbConnection, err := sqlx.Connect("sqlite3", "./db.sqlite3")
	if err == nil {
		return nil, err
	}
	return dbConnection, nil
}

// Get get the instance of sqlx connection
func Get() *sqlx.DB {
	if db != nil {
		return db
	}
	thisDb, err := initDb()
	if err != nil {
		return nil
	}
	db = thisDb
	return db
}
