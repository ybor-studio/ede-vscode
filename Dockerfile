# pin to amd64, universal:linux does not have arm64
# TODO: make our own
FROM --platform=linux/amd64 mcr.microsoft.com/devcontainers/universal:linux AS universal

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

# FROM ybor/node:22-bullseye AS extension-builder
# WORKDIR /workdir
# COPY . .
# RUN npm install && \    
#     npm run package -- --out extension.vsix

# FROM ybor/vscode:latest

# RUN apt-get update && \
#     apt-get install -y build-essential git curl net-tools && \
#     rm -rf /var/lib/apt/lists/*

# COPY --from=extension-builder /workdir/extension.vsix /tmp/extension.vsix
# RUN code-server \
#     --server-data-dir /code-server \
#     --builtin-extensions-dir /code-server/extensions \
#     --install-builtin-extension /tmp/extension.vsix \
#     --force && \
#     rm /tmp/extension.vsix

# ENTRYPOINT [ "code-server" ]
# CMD ["--server-data-dir", "/code-server", "--accept-server-license-terms", "--host", "0.0.0.0", "--port", "2999", "--enable-proposed-api", "ybor-studio.ede-vscode", "--log", "trace"]
# EXPOSE 2999
