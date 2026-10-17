FROM node:24-bookworm-slim

# Cursor checks out the requested repository after preparing this development image.
# Keep Node in the image's global PATH so fresh agent shells use the same runtime.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash ca-certificates curl git openssh-client procps sudo \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --shell /bin/bash ubuntu \
    && echo 'ubuntu ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/ubuntu \
    && chmod 0440 /etc/sudoers.d/ubuntu

USER ubuntu
WORKDIR /home/ubuntu
ENTRYPOINT []
CMD ["/bin/bash"]
