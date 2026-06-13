FROM ubuntu:26.04
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg jq yt-dlp && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENTRYPOINT ["bash", "tools/download.sh"]
