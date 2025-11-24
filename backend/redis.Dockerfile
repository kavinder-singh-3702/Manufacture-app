FROM redis:7.2-alpine

WORKDIR /usr/local/etc/redis

COPY redis.conf .

# If REDIS_PASSWORD is provided, it is passed to redis-server via --requirepass.
ENV REDIS_PASSWORD=

EXPOSE 6379

CMD ["sh", "-c", "if [ -n \"$REDIS_PASSWORD\" ]; then redis-server /usr/local/etc/redis/redis.conf --requirepass \"$REDIS_PASSWORD\"; else redis-server /usr/local/etc/redis/redis.conf; fi"]
