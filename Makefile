ifeq ($(origin GOPATH), undefined)
pwd = $(shell pwd)
GOPATH = $(pwd)/.go
endif

rice = $(GOPATH)/bin/rice

news: migrations/rice-box.go *.go **/*.go
	GO111MODULE=on go build

migrations/rice-box.go: $(rice) migrations/sql/*.sql
	go generate ./migrations/

$(rice):
	GOPATH=$(GOPATH) go get github.com/GeertJohan/go.rice/rice

clean:
	rm ./migrations/rice-box.go
	rm -rf ./.go
