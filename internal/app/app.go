package app

import (
	"errors"

	"github.com/GodwinJacobR/go-todo-app/internal/db"
	"github.com/gorilla/mux"
)

type App struct {
	db     *db.Db
	router *mux.Router
}

func New() *App {
	db, err := db.New()
	if err != nil {
		panic(err)
	}

	return &App{
		db:     db,
		router: mux.NewRouter(),
	}
}

func (a *App) Start() error {
	return errors.Join(
		a.db.Migrate(),
	)
}

func (a *App) Stop() error {
	return errors.Join(
		a.db.Close(),
	)
}

func (a *App) GetRouter() *mux.Router {
	return a.router
}
