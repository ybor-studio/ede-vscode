# pin to amd64, universal:linux does not have arm64
# TODO: make our own
FROM --platform=linux/amd64 mcr.microsoft.com/devcontainers/universal:linux AS universal
# Increment this to break the docker cache for this stage
ENV CACHE_BUST=1

RUN apt-get update \
    && apt-get upgrade -y \
    && apt-get install -y \
    gnupg2 \
    curl \
    apt-transport-https \
    lsb-release \
    ca-certificates \
    software-properties-common \
    sudo

RUN groupmod -n ede codespace \
    && usermod -l ede -d /ede -m -u 1000 -c "ede" -g ede -aG docker -aG staff codespace

RUN mv /etc/sudoers.d/codespace /etc/sudoers.d/ede \
    && sed -i 's/\/home\/codespace/\/ede/g' /etc/sudoers.d/ede \
    && sed -i 's/codespace/ede/g' /etc/sudoers.d/ede \
    && sed -i 's/\/home\/codespace/\/ede/g' /etc/profile.d/00-restore-env.sh

USER ede
WORKDIR /ede
ENV HOME=/ede \
    USER=ede

FROM universal AS vscode
# Increment this to break the docker cache for this stage
ENV CACHE_BUST=1

RUN ARCH=$(uname -m) && \
    case "$ARCH" in \
    x86_64) ARCH_SUFFIX="x64" ;; \
    aarch64) ARCH_SUFFIX="arm64" ;; \
    *) echo "Unsupported architecture: $ARCH" && exit 1 ;; \
    esac && \
    sudo mkdir -p /code-server && \
    URL="https://vscode.download.prss.microsoft.com/dbazure/download/stable/f220831ea2d946c0dcb0f3eaa480eb435a2c1260/vscode-server-linux-$ARCH_SUFFIX-web.tar.gz" && \
    echo "Downloading: $URL" && \
    curl -fsSL "$URL" | sudo tar -xz --strip-components=1 -C /code-server && \
    sudo chown -R ede:staff /code-server

ENV PATH="/code-server/bin:$PATH" \
    IDE="code-server"

RUN code-server --version

FROM vscode AS extensions
# Increment this to break the docker cache for this stage
ENV CACHE_BUST=1

RUN for extension in \
    ms-python.black-formatter \
    ms-python.vscode-pylance \
    ms-python.python \
    ms-python.debugpy \
    ms-python.vscode-python-envs \
    ; do \
    code-server --extensions-dir=/code-server/extensions --install-extension "$extension" --force; \
    done

FROM ybor/node:22-bullseye AS vscode-extension
# Increment this to break the docker cache for this stage
ENV CACHE_BUST=1

WORKDIR /work
COPY . .
RUN npm install && \
    npm run package -- --out extension.vsix

FROM extensions AS final
# Increment this to break the docker cache for this stage
ENV CACHE_BUST=1

COPY --from=vscode-extension /work/extension.vsix /tmp/extension.vsix
RUN code-server --install-extension /tmp/extension.vsix --force

# Additional pipx packages
RUN pipx install \
    uv

COPY fs/usr /usr

ENTRYPOINT [ "code-server" ]
CMD ["--server-data-dir", "/code-server", "--accept-server-license-terms", "--host", "0.0.0.0", "--port", "2999", "--enable-proposed-api", "ybor-studio.ede-vscode", "--log", "trace"]
EXPOSE 2999
