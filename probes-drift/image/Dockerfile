FROM golang:1.24 AS builder
ARG TARGETOS
ARG TARGETARCH

WORKDIR /workspace

COPY main.go main.go

RUN printf "Building for %s/%s\n" "${TARGETOS:-linux}" "${TARGETARCH}"
RUN CGO_ENABLED=0 GOOS=${TARGETOS:-linux} GOARCH=${TARGETARCH} go build -ldflags="-s -w" -a -o liveness-drift main.go

FROM gcr.io/distroless/static:nonroot
WORKDIR /
COPY --from=builder /workspace/liveness-drift .
USER 65532:65532
EXPOSE 8080

ENTRYPOINT ["/liveness-drift"]