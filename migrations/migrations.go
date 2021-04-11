package migrations

import (
	"errors"

	rice "github.com/GeertJohan/go.rice"
	migrate "github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	bindata "github.com/golang-migrate/migrate/v4/source/go_bindata"
	_ "github.com/mattn/go-sqlite3"

	"github.com/papodaca/news/db"
)

//go:generate rice embed-go

var box = rice.MustFindBox("sql")

func migrations() []string {
	dir, err := box.Open("")
	if err != nil {
		return nil
	}
	files, err := dir.Readdir(0)
	if err != nil {
		return nil
	}
	result := make([]string, 0, len(files))
	for _, file := range files {
		if !file.IsDir() {
			result = append(result, file.Name())
		}
	}
	return result
}

// RunMigrations run penging migrations
func RunMigrations() error {
	dbConnection := db.Get()
	if dbConnection == nil {
		return errors.New("could not migrate database")
	}

	assetSource := bindata.Resource(migrations(), box.Bytes)

	sourceDriver, err := bindata.WithInstance(assetSource)
	if err != nil {
		return err
	}

	databaseDriver, err := sqlite3.WithInstance(dbConnection.DB, &sqlite3.Config{})
	if err != nil {
		return err
	}

	m, err := migrate.NewWithInstance("go-bindata", sourceDriver, "database://foobar", databaseDriver)
	if err != nil {
		return err
	}

	m.Up()

	return nil
}
