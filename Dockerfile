FROM node:20-alpine3.17

WORKDIR /src
ADD /src /src

EXPOSE 8080

# Compile the app so that it doesn't need to be compiled at each start.
RUN deno cache deno-demo.ts

CMD ["run", "--allow-net", "deno-demo.ts"]