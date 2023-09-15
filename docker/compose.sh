#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

environment="$(
  if [[ $1 == 'dev' ]]; then
    echo "development"
  elif [[ $1 == 'prod' ]]; then
    echo "production"
  else
    echo "$1"
  fi
)"

if [[ -z $environment || ($environment != "development" && $environment != "production") ]]; then
  echo "Usage: $0 <environment> <compose arguments>"
  echo "  environment: dev, development, prod, or production"
  exit 1
fi

envArguments="$(
  if [[ -f .env ]]; then
    echo " --env-file .env"
  fi
  if [[ -f .env.local ]]; then
    echo " --env-file .env.local"
  fi
  if [[ -f .env.$environment ]]; then
    echo " --env-file .env.$environment"
  fi
  if [[ -f .env.$environment.local ]]; then
    echo " --env-file .env.$environment.local"
  fi
)"

composeArguments="${@:2}"

docker compose \
  -f docker-compose.yaml \
  $envArguments \
  $composeArguments
