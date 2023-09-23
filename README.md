# CineLSD Backend

- [CineLSD Backend](#cinelsd-backend)
  - [Projetos](#projetos)
  - [Dependências](#dependências)
  - [Como executar](#como-executar)
    - [Transformer](#transformer)
      - [Normalizar dados](#normalizar-dados)
      - [Importar dados normalizados](#importar-dados-normalizados)
      - [Verificar referências a filmes](#verificar-referências-a-filmes)
      - [Exportar IDs dos atores](#exportar-ids-dos-atores)
    - [Servidores](#servidores)
      - [Servidor Go](#servidor-go)
      - [Servidor Node.js](#servidor-nodejs)
  - [Deploy](#deploy)
    - [Servidores](#servidores-1)
      - [Servidor Go](#servidor-go-1)
      - [Servidor Node.js](#servidor-nodejs-1)
    - [Monitoramento](#monitoramento)

## Projetos

- [Server Go](./server/go): o servidor original do CineLSD, escrito em Go e baseado em [caetanobca/IMDB-API](https://github.com/caetanobca/IMDB-API).
- [Server Node.js](./server/node): versão alternativa do servidor do CineLSD, escrito em Node.js.
- [Transformer](./transformer): o transformador usado para normalizar os dados da API do IMDb, escrito em TypeScript.

## Dependências

- Gerais
  - [Docker][docker-install]
  - [Redis][redis] (não é necessária a instalação local, pois é usado através do Docker)
- Servidor
  - Go
    - [Go][go]
  - Node.js
    - [Node.js][node-js]
    - [TypeScript][typescript]
    - [pnpm][pnpm]
- Transformer
  - [Node.js][node-js]
  - [TypeScript][typescript]
  - [pnpm][pnpm]

[docker-install]: https://docs.docker.com/engine/install
[redis]: https://redis.com
[go]: https://go.dev
[typescript]: https://www.typescriptlang.org
[node-js]: https://nodejs.org
[pnpm]: https://pnpm.io

## Como executar

### Transformer

Nota: se você não precisa fazer a geração local dos dados normalizados, é possível baixar o arquivo pré-gerado no passo 1. Após isso, nenhuma configuração a mais precisa ser feita no transformer e você pode seguir para os passos de configuração do servidor.

1. Baixe os dados normalizados a serem usados pelo transformer.

   - [Dados normalizados](https://drive.google.com/file/d/1xVvmMz-lJBsyNyqxp073_y-kBXjOt5q4/view?usp=sharing)
     - O arquivo `dump.rdb` deve ser baixado na pasta `transformer/data/normalized`.

2. Baixe os dados brutos a serem usados pelo transformer.

   - [Dados brutos (não normalizados)](https://drive.google.com/file/d/1AM_btyRs4y-KLVJoJ0VkaWGq7XaQRtg5/view?usp=sharing)
     - O arquivo `dump.rdb` deve ser baixado na pasta `transformer/data/raw`.

3. Entre no projeto do transformer e instale as dependências.

   ```bash
   cd transformer
   pnpm install
   ```

Agora, será possível executar o transformer usando os seguintes comandos:

#### Normalizar dados

1. Mude o caminho do volume do serviço `cinelsd-redis`, em `docker-compose.yaml` para usar os dados brutos.

   ```yaml
   volumes:
     - ./transformer/data/raw:/data
   ```

2. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker/compose.sh dev up cinelsd-redis -d --wait
   ```

3. Crie a pasta `./transformer/local`, para onde os dados normalizados serão exportados.

4. Após o serviço do Redis ter inicializado, execute o comando de exportação em outro terminal, de dentro da pasta `transformer`:

   ```bash
   pnpm run normalize
   ```

   Após a execução desse comando, os dados normalizados terão sido exportados para `local/actors.txt`, `local/movies.txt` e `local/movie-main-actors.txt`, com uma entidade por linha.

#### Importar dados normalizados

1. Mude o caminho do volume do serviço `cinelsd-redis`, em `docker-compose.yaml` para usar os dados normalizados.

   ```yaml
   volumes:
     - ./transformer/data/normalized:/data
   ```

2. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker/compose.sh dev up cinelsd-redis -d --wait
   ```

3. Após o serviço do Redis ter inicializado, execute o comando de importação em outro terminal, de dentro da pasta `transformer`:

   ```bash
   pnpm run import
   ```

   Após a execução desse comando, os dados normalizados terão sido importados de `local/actors.txt`, `local/movies.txt` e `local/movie-main-actors.txt` para a instância do Redis em execução.

#### Verificar referências a filmes

1. Mude o caminho do volume do serviço `cinelsd-redis`, em `docker-compose.yaml` para usar os dados normalizados.

   ```yaml
   volumes:
     - ./transformer/data/normalized:/data
   ```

2. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker/compose.sh dev up cinelsd-redis -d --wait
   ```

3. Após o serviço do Redis ter inicializado, execute o comando de verificação em outro terminal, de dentro da pasta `transformer`:

   ```bash
   pnpm run references:check
   ```

   Após a execução desse comando, referências de atores a filmes não existentes terão sido removidas, assim como atores que ficaram sem filmes associados após a remoção das referências inválidas.

#### Exportar IDs dos atores

1. Mude o caminho do volume do serviço `cinelsd-redis`, em `docker-compose.yaml` para usar os dados normalizados.

   ```yaml
   volumes:
     - ./transformer/data/normalized:/data
   ```

2. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker/compose.sh dev up cinelsd-redis -d --wait
   ```

3. Após o serviço do Redis ter inicializado, execute o comando de exportação em outro terminal, de dentro da pasta `transformer`:

   ```bash
   pnpm run actors:export-ids
   ```

   Após a execução desse comando, todos os IDs dos atores atualmente cadastrados serão exportados para um arquivo `actors.txt` na pasta em que o comando foi executado.

### Servidores

Os servidores em Go e Node.js são implementações diferentes com o mesmo funcionamento. Portanto, é necessário escolher apenas um deles para executar.

Para saber mais sobre os endpoints disponíveis, o arquivo [api-insomnia.json](./docs/api-insomnia.json) contém exemplos de todas as requisições e pode ser importado no [Insomnia](https://insomnia.rest).

#### Servidor Go

Tendo os dados normalizados disponíveis em `transformer/data/normalized/dump.rdb`, é possível fazer a configuração do servidor Go.

1. Entre no projeto do servidor e instale as dependências.

   ```bash
   cd server/go
   go mod download
   ```

2. Mude o caminho do volume do serviço `cinelsd-redis` para usar os dados normalizados em `docker-compose.yaml`.

   ```yaml
   volumes:
     - ./transformer/data/normalized:/data
   ```

3. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker/compose.sh dev up cinelsd-redis -d --wait
   ```

4. Após o serviço do Redis ter inicializado, inicie o servidor em outro terminal, de dentro da pasta `server/go`:

   ```bash
   go run ./src
   ```

   Após a execução desse comando, o servidor deve estar rodando em `localhost:8001`.

#### Servidor Node.js

Tendo os dados normalizados disponíveis em `transformer/data/normalized/dump.rdb`, é possível fazer a configuração do servidor Node.js.

1. Entre no projeto do servidor e instale as dependências.

   ```bash
   cd server/node
   pnpm install
   ```

2. Mude o caminho do volume do serviço `cinelsd-redis` para usar os dados normalizados em `docker-compose.yaml`.

   ```yaml
   volumes:
     - ./transformer/data/normalized:/data
   ```

3. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker/compose.sh dev up cinelsd-redis -d --wait
   ```

4. Após o serviço do Redis ter inicializado, inicie o servidor em outro terminal, de dentro da pasta `server/node`:

   ```bash
   pnpm run dev
   ```

   Após a execução desse comando, o servidor deve estar rodando em `localhost:8002`.

## Deploy

### Servidores

O deploy dos servidores é feito usando Docker e Docker Compose.

1. Declare um arquivo `.env.production.local` dentro de [docker](./docker), caso não exista. Este arquivo deve conter as variáveis listadas em [.env.example](./docker/.env.example).

#### Servidor Go

2. Faça a build da imagem do servidor:

   ```bash
   docker/compose.sh prod build cinelsd-server-go
   ```

3. Siga o [passo 1 da configuração do transformer](#transformer) para baixar os dados normalizados.

4. Inicie o servidor:

   ```bash
   docker/compose.sh prod up cinelsd-server-go -d --wait
   ```

   Esse comando também irá inicializar o serviço de Redis automaticamente.

Após isso, o servidor Go deve estar pronto para uso e rodando na porta `8001`.

#### Servidor Node.js

2. Faça a build da imagem do servidor:

   ```bash
   docker/compose.sh prod build cinelsd-server-node
   ```

3. Siga o [passo 1 da configuração do transformer](#transformer) para baixar os dados normalizados.

4. Inicie o servidor:

   ```bash
   docker/compose.sh prod up cinelsd-server-node -d --wait
   ```

   Esse comando também irá inicializar o serviço de Redis automaticamente.

Após isso, o servidor Node.js deve estar pronto para uso e rodando na porta `8002`.

### Monitoramento

Para monitoramento, são usados o [Prometheus](https://prometheus.io) e o [Grafana](https://grafana.com).

1. Inicie o Prometheus e o Grafana:

   ```bash
   docker/compose.sh prod up cinelsd-prometheus cinelsd-grafana -d --wait
   ```

2. Após iniciar, verifique se foi possível conectar o stats exporter ao Docker:

   ```bash
   docker/compose.sh prod logs cinelsd-prometheus-stats-exporter
   ```

   Se não haver logs de erro, o stats exporter está funcionando corretamente.

   Caso tenha erros de permissão ao montar o `/var/run/docker.sock`, volte ao passo 1 e tente executar o comando com `sudo`.

Após isso, o Prometheus estará disponível na porta `9000` e a interface do Grafana, na porta `9001`.
