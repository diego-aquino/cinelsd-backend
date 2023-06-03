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
    - [Servidor](#servidor)
  - [Deploy](#deploy)
    - [Servidor](#servidor-1)

## Projetos

- [Server](./server): o servidor do CineLSD, escrito em Go.
- [Transformer](./transformer): o transformador usado para normalizar os dados da API do IMDb, escrito em TypeScript.

## Dependências

- Gerais
  - [Docker](https://docs.docker.com/engine/install)
  - [Redis](https://redis.com) (não é necessária a instalação local, pois é usado através do Docker)
- Server
  - [Go](https://go.dev)
- Transformer
  - [Node.js](https://nodejs.org)
  - [TypeScript](https://www.typescriptlang.org)
  - [pnpm](https://pnpm.io/)

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
   docker compose up cinelsd-redis
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
   docker compose up cinelsd-redis
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
   docker compose up cinelsd-redis
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
   docker compose up cinelsd-redis
   ```

3. Após o serviço do Redis ter inicializado, execute o comando de exportação em outro terminal, de dentro da pasta `transformer`:

   ```bash
   pnpm run actors:export-ids
   ```

   Após a execução desse comando, todos os IDs dos atores atualmente cadastrados serão exportados para um arquivo `actors.txt` na pasta em que o comando foi executado.

### Servidor

Tendo os dados normalizados disponíveis em `transformer/data/normalized/dump.rdb`, é possível fazer a configuração do servidor.

1. Entre no projeto do servidor e instale as dependências.

   ```bash
   cd server
   go mod download
   ```

2. Mude o caminho do volume do serviço `cinelsd-redis`, em `docker-compose.yaml` para usar os dados normalizados.

   ```yaml
   volumes:
     - ./transformer/data/normalized:/data
   ```

3. Da raiz deste repositório, inicie o serviço do Redis, se já não estiver rodando.

   ```bash
   docker compose up cinelsd-redis
   ```

4. Após o serviço do Redis ter inicializado, inicie o servidor em outro terminal, de dentro da pasta `server`:

   ```bash
   go run ./src
   ```

   Após a execução desse comando, o servidor deve estar rodando em `localhost:8001`.

Para saber mais sobre os endpoints disponíveis, o arquivo [api-insomnia.json](./server/docs/api-insomnia.json) contém exemplos de todas as requisições e pode ser importado no [Insomnia](https://insomnia.rest).

## Deploy

### Servidor

O deploy do servidor é feito usando Docker e Docker Compose.

1. Faça a build da imagem do servidor:

   ```bash
   docker compose build cinelsd-server
   ```

2. Siga o [passo 1 da configuração do transformer](#transformer) para baixar os dados normalizados.

3. Inicie o servidor:

   ```bash
    REDIS_RESTART_POLICY=always \
      SERVER_RESTART_POLICY=always \
      SERVER_GOMAXPROCS=<numero-de-cpus> \
      docker compose up cinelsd-server -d --wait
   ```

   Esse comando também irá inicializar o serviço de Redis automaticamente.

Após isso, o servidor deve estar pronto para uso e rodando na porta `8001` da máquina utilizada.
