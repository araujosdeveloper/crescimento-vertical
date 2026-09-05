FROM python@sha256:62e80a1ff2a4af41c6fe72a629e5729463a4fd05ae89ecc9c812a6c1457f2cc7

WORKDIR /app
COPY services/phase8-egress-proxy/proxy.py /app/proxy.py

RUN addgroup -g 10001 proxy && adduser -D -H -u 10001 -G proxy proxy \
    && chown -R 10001:10001 /app && chmod 0555 /app/proxy.py

USER 10001:10001
ENTRYPOINT ["python", "/app/proxy.py"]
