# INFO-7255: Adv Big Data Indexing Techniques

[![Unit Test Suite](https://github.com/sydrawat01/INFO7255/actions/workflows/test-suite.yml/badge.svg)](https://github.com/sydrawat01/INFO7255/actions/workflows/test-suite.yml)

A course on distributed systems and big data indexing techniques.

## Automated Setup

To install all application dependencies [Elasticsearch, Kibana and RabbitMQ], use the `docker-compose.yml` file to deploy all application dependencies using `docker compose`.

- To create the cluster, run:

  ```bash
  docker compose up
  ```

- To delete the cluster and the network:

  ```bash
  docker compose down
  ```

- The default username and password for RabbitMQ is defined in the `docker-compose.yml` file.
  - default username: `guest`
  - default password: `guest`

- The following is a list of the endpoints for the dependencies being created in docker:
  - Elasticsearch: [http://localhost:9200](http://localhost:9200)
  - Kibana: [http://localhost:5610](http://localhost:5610)
  - RabbitMQ: [http://localhost:15672](http://localhost:15672)

## Manual Setup

- Install redis

  ```shell
  # only for MacOs
  brew install redis
  ```

- Install the dependencies

   ```shell
   yarn
   # or if you are using npm: npm i
   ```

- Start the server locally

   ```shell
   yarn start:dev
   # npm run start:dev
   ```

### [Elasticsearch Setup using Docker](https://www.elastic.co/guide/en/elasticsearch/reference/8.11/docker.html)

We'll use a docker container to connect to the elasticsearch service. So make sure you have docker installed.

To run the elasticsearch image in a docker container (single-node cluster):

- Create a new docker network

  ```bash
  # docker network create elasticnet
  docker network create <network-name>
  ```

- Pull the elastic docker image

  ```bash
  # Running an elastic docker container only works with a specified tag, not with
  # latest versions.
  # docker pull docker.elastic.co/elasticsearch/elasticsearch:8.11.1
  docker pull docker.elastic.co/elasticsearch/elasticsearch:[tag]
  ```

> Use the -m flag to set a memory limit for the container. This removes the need to [manually set the JVM size](https://www.elastic.co/guide/en/elasticsearch/reference/8.11/docker.html#docker-set-heap-size).

- Start an elasticsearch container

  ```bash
  # docker run --name es01 --net elasticnet -p 9200:9200 -it -m 1GB docker.elastic.co/elasticsearch/elasticsearch:8.11.1
  docker run --name <container-name> --net <network-name> -p 9200:9200 -it -m 1GB \
    docker.elastic.co/elasticsearch/elasticsearch:[tag]
  ```

> The command prints the `elastic` user password and an enrollment token for Kibana.

- Copy the generated `elastic` password and enrollment token. These credentials are only shown when you start Elasticsearch for the first time. You can regenerate the credentials using the following commands.

  ```bash
  docker exec -it es01 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
  docker exec -it es01 /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
  ```

- We recommend storing the elastic password as an environment variable in your shell

  ```bash
  export ELASTIC_PASSWORD="your_password"
  ```

- Copy the `http_ca.crt` SSL certificate from the container to your local machine.

  ```bash
  # docker cp es01:/usr/share/elasticsearch/config/certs/http_ca.crt /Users/sid/Developer/api/src/certs
  docker cp <container-name>:/usr/share/elasticsearch/config/certs/http_ca.crt /path/to/your/folder
  ```

- Make a REST API call to Elasticsearch to ensure the Elasticsearch container is running.

  ```bash
  curl --cacert /Users/sid/Developer/api/src/certs/http_ca.crt -u elastic:$ELASTIC_PASSWORD https://localhost:9200
  ```

This should printout a success message that looks similar to this:

```json
{
  "name" : "686b14641876",
  "cluster_name" : "docker-cluster",
  "cluster_uuid" : "C4TdqRy3QKSQM9Cri2HBKA",
  "version" : {
    "number" : "8.11.1",
    "build_flavor" : "default",
    "build_type" : "docker",
    "build_hash" : "6f9ff581fbcde658e6f69d6ce03050f060d1fd0c",
    "build_date" : "2023-11-11T10:05:59.421038163Z",
    "build_snapshot" : false,
    "lucene_version" : "9.8.0",
    "minimum_wire_compatibility_version" : "7.17.0",
    "minimum_index_compatibility_version" : "7.0.0"
  },
  "tagline" : "You Know, for Search"
}
```

### Kibana

To install the Kibana docker image:

- Pull the Kibana Docker image.

  ```bash
  # docker pull docker.elastic.co/kibana/kibana:8.11.1
  docker pull docker.elastic.co/kibana/kibana:[tag]
  ```

- Start a Kibana container.

  ```bash
  # docker run --name kib01 --net elastic -p 5601:5601 docker.elastic.co/kibana/kibana:8.11.1
  docker run --name <container-name> --net <network-name> -p 5601:5601 docker.elastic.co/kibana/kibana:[tag]
  ```

> NOTE: When Kibana starts, it outputs a unique generated link to the terminal. To access Kibana, open this link in a web browser. In your browser, enter the enrollment token that was generated when you started Elasticsearch.

- To regenerate the token

  ```bash
  docker exec -it es01 /usr/share/elasticsearch/bin/elasticsearch-create-enrollment-token -s kibana
  ```

- Log in to Kibana as the `elastic` user with the password that was generated when you started Elasticsearch

  ```bash
  # to regenerate the password, run:
  docker exec -it es01 /usr/share/elasticsearch/bin/elasticsearch-reset-password -u elastic
  ```

### RabbitMQ

To install the RabbitMQ docker image:

- Pull the RabbitMQ docker image

  ```bash
  # docker pull rabbitmq:3.12-management-alpine
  docker pull rabbitmq:[tag]
  ```

- Create the RabbitMQ docker container

  ```bash
  # docker run -it --rm --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3.12-management-alpine
  docker run -it --rm --name <container-name> -p 5672:5672 -p 15672:15672 rabbitmq:[tag]
  ```

## Manual setup teardown

To remove the containers and their network, run:

```bash
# Remove the Elastic network
# docker network rm elastic
docker network rm <network-name>

# Remove Elasticsearch, Kibana and RabbitMQ containers
# docker rm es01
docker rm <elastic-container-name>
# docker rm kib01
docker rm <kibana-container-name>
# docker rm rabbitmq
docker rm <rabbitmq-container-name>
```

## Author

[Siddharth Rawat](https://sydrawat.live)

## [License](./LICENSE)

This project is licensed under the MIT License. ([see license file for details](./LICENSE))
