# Build a local equivalent of mcr.microsoft.com/devcontainers/universal:linux plus the
# dependencies declared in the upstream manifest, and then layer our vscode bits on top.
# Everything is kept in this single Dockerfile so we don't depend on the published image.
FROM ubuntu:noble AS universal

ENV DEBIAN_FRONTEND=noninteractive \
    LANG=C.UTF-8 \
    SHELL=/bin/bash \
    DOCKER_BUILDKIT=1

# Remove default ubuntu user if present (matches upstream universal image).
RUN if id "ubuntu" >/dev/null 2>&1; then userdel -f -r ubuntu || true; fi

# Upstream image shows a first-run notice; keep a lightweight version here.
RUN mkdir -p /usr/local/etc/vscode-dev-containers && \
    cat <<'EOF' >/usr/local/etc/vscode-dev-containers/first-run-notice.txt
Welcome to the EDE universal devcontainer. This image mirrors the upstream
devcontainers/universal base along with the manifest dependencies.
EOF

# Core tools from the upstream universal Dockerfile and manifest, plus the major
# devcontainer features defined in the upstream devcontainer.json.
# We deliberately keep this as a single layer to keep the image size down.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl gnupg software-properties-common && \
    add-apt-repository universe && \
    add-apt-repository -y ppa:ondrej/php && \
    apt-get update && \
    install -d /etc/apt/keyrings && \
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/keyrings/microsoft.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/microsoft.gpg] https://packages.microsoft.com/ubuntu/24.04/prod noble main" > /etc/apt/sources.list.d/microsoft-prod.list && \
    curl -fsSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/microsoft.gpg && \
    apt-get update && \
    if command -v unminimize >/dev/null 2>&1; then yes | unminimize 2>&1; fi && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
    apt-transport-https \
    build-essential \
    ca-certificates \
    clang \
    cmake \
    cppcheck \
    curl \
    default-libmysqlclient-dev \
    fish \
    g++ \
    gcc \
    gettext \
    gdb \
    git \
    git-lfs \
    gnupg2 \
    inotify-tools \
    iptables \
    jq \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libgbm1 \
    libgdiplus \
    libgssapi-krb5-2 \
    libk5crypto3 \
    libgtk-3-0 \
    liblttng-ust1 \
    libncurses6 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libpq-dev \
    libsecret-1-dev \
    libsqlite3-dev \
    libssl-dev \
    libstdc++6 \
    libunwind8 \
    libuuid1 \
    libx11-6 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    lldb \
    llvm \
    lsb-release \
    lxc \
    make \
    moby-cli \
    moby-engine \
    moreutils \
    openssh-server \
    pkg-config \
    pigz \
    pipx \
    python3-dev \
    python3-minimal \
    python3-pip \
    rsync \
    sed \
    software-properties-common \
    sqlite3 \
    sudo \
    swig3.0 \
    tar \
    tk-dev \
    unzip \
    unixodbc-dev \
    uuid-dev \
    valgrind \
    vim \
    vim-doc \
    xtail \
    zip \
    zlib1g && \
    add-apt-repository universe && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    docker-compose-plugin \
    lsb-release \
    gh \
    dotnet-sdk-8.0 \
    openjdk-21-jdk \
    openjdk-17-jdk \
    maven \
    gradle && \
    apt-get autoremove -y && apt-get clean -y && rm -rf /var/lib/apt/lists/*

# .NET 9 runtimes (best effort; still preview at time of writing).
RUN apt-get update && \
    (apt-get install -y --no-install-recommends dotnet-runtime-9.0 aspnetcore-runtime-9.0 || echo ".NET 9 runtime unavailable, skipping") && \
    apt-get clean -y && rm -rf /var/lib/apt/lists/*

# PHP 8.4/8.3 with Composer (best effort if 8.4 is not yet available).
RUN apt-get update && \
    (apt-get install -y --no-install-recommends php8.4 php8.4-cli || echo "php 8.4 packages unavailable, skipping") && \
    apt-get install -y --no-install-recommends php8.3 php8.3-cli composer && \
    apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Additional Python versions and JupyterLab matching feature config.
RUN add-apt-repository -y ppa:deadsnakes/ppa && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    python3.12 \
    python3.12-venv \
    python3.11 \
    python3.11-venv \
    python3.12-distutils \
    python3.11-distutils && \
    apt-get clean -y && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/python && \
    python3.12 -m venv /usr/local/python/3.12 && \
    python3.11 -m venv /usr/local/python/3.11 && \
    ln -sfn /usr/local/python/3.12 /usr/local/python/current

# Miniconda for "conda" feature, with JupyterLab pre-installed.
ENV CONDA_DIR=/opt/conda
RUN curl -fsSL https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -o /tmp/miniconda.sh && \
    bash /tmp/miniconda.sh -b -p "$CONDA_DIR" && \
    rm /tmp/miniconda.sh && \
    "$CONDA_DIR/bin/conda" install -y jupyterlab && \
    "$CONDA_DIR/bin/conda" clean -afy
ENV PATH="${CONDA_DIR}/bin:${PATH}"
ENV JUPYTER_SERVER_ALLOW_ORIGIN="*"

# Node.js 22 (default) and 20 via nvm.
ENV NVM_DIR=/usr/local/share/nvm
RUN mkdir -p "$NVM_DIR" && \
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | NVM_DIR=$NVM_DIR bash && \
    bash -c "export NVM_DIR=$NVM_DIR && . $NVM_DIR/nvm.sh && nvm install 22 && nvm install 20 && nvm alias default 22 && nvm cache clear && ln -sfn $NVM_DIR/versions/node/v22.* $NVM_DIR/versions/node/current" && \
    printf 'export NVM_DIR="/usr/local/share/nvm"\n[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"\n' > /etc/profile.d/nvm.sh
ENV PATH="/usr/local/share/nvm/versions/node/current/bin:${PATH}"

# Hugo latest (static site), kubectl/helm/minikube for k8s tooling.
RUN HUGO_VERSION=$(curl -fsSL https://api.github.com/repos/gohugoio/hugo/releases/latest | jq -r .tag_name | sed 's/^v//') && \
    curl -fsSL "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_${HUGO_VERSION}_linux-amd64.tar.gz" | tar -xz -C /usr/local/bin hugo && \
    KUBE_VERSION=$(curl -L -s https://dl.k8s.io/release/stable.txt) && \
    curl -fsSLo /usr/local/bin/kubectl "https://dl.k8s.io/release/${KUBE_VERSION}/bin/linux/amd64/kubectl" && \
    chmod +x /usr/local/bin/kubectl && \
    HELM_FILE=$(curl -fsSL https://api.github.com/repos/helm/helm/releases/latest | jq -r '.assets[] | select(.name | test(\"linux-amd64.tar.gz$\")) | .browser_download_url') && \
    curl -fsSL "$HELM_FILE" | tar -xz -C /tmp && mv /tmp/linux-amd64/helm /usr/local/bin/helm && rm -rf /tmp/linux-amd64 && \
    curl -fsSLo /usr/local/bin/minikube https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64 && \
    chmod +x /usr/local/bin/minikube

# Provide libssl1.1 for compatibility with some tooling (mirrors upstream logic).
RUN ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ] || [ "$ARCH" = "amd64" ]; then \
    curl -fsSL -o /tmp/libssl1.1.deb http://archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_amd64.deb; \
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then \
    curl -fsSL -o /tmp/libssl1.1.deb http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2_arm64.deb; \
    else \
    echo "Unsupported architecture: $ARCH" && exit 1; \
    fi && \
    dpkg -i /tmp/libssl1.1.deb && rm /tmp/libssl1.1.deb

# Install Python tooling called out in the manifest.
RUN python3 -m pip install --no-cache-dir --upgrade pip setuptools wheel && \
    for pkg in \
    numpy \
    pandas \
    scipy \
    matplotlib \
    seaborn \
    scikit-learn \
    torch \
    requests \
    plotly \
    jupyterlab \
    jupyterlab_git \
    certifi \
    setuptools \
    wheel \
    ; do python3 -m pip install --no-cache-dir "$pkg"; done

RUN for pkg in \
    pylint \
    flake8 \
    autopep8 \
    black \
    yapf \
    mypy \
    pydocstyle \
    pycodestyle \
    bandit \
    virtualenv \
    pipx \
    ; do python3 -m pipx install --include-deps "$pkg" || true; done

# Basic Ruby/Gem tooling listed in the manifest.
RUN apt-get update && \
    apt-get install -y --no-install-recommends ruby-full && \
    gem install --no-document \
    rake \
    ruby-debug-ide \
    debase \
    jekyll && \
    apt-get clean -y && rm -rf /var/lib/apt/lists/*

# Go tooling mentioned in the manifest.
RUN apt-get update && \
    apt-get install -y --no-install-recommends golang-go && \
    export GOPATH=/usr/local/go && \
    for pkg in \
    golang.org/x/tools/gopls \
    honnef.co/go/tools \
    golang.org/x/lint \
    github.com/mgechev/revive \
    github.com/uudashr/gopkgs \
    github.com/ramya-rao-a/go-outline \
    github.com/go-delve/delve/cmd/dlv \
    github.com/golangci/golangci-lint/cmd/golangci-lint \
    ; do GO111MODULE=on GOPATH=$GOPATH GOBIN=/usr/local/bin go install "$pkg@latest" || true; done && \
    apt-get clean -y && rm -rf /var/lib/apt/lists/*

# User setup to mirror the upstream "codespace" user but renamed to ede.
RUN groupadd -r docker || true && \
    groupadd -g 1000 ede && \
    useradd -s /bin/bash -u 1000 -g ede -m -d /ede -c "ede" ede && \
    usermod -aG docker,staff,sudo ede && \
    echo "ede ALL=(ALL) NOPASSWD:ALL" >/etc/sudoers.d/ede && \
    chmod 0440 /etc/sudoers.d/ede

# Fish prompt and aliases similar to upstream.
RUN FISH_PROMPT="function fish_prompt\n    set_color green\n    echo -n (whoami)\n    set_color normal\n    echo -n \":\"\n    set_color blue\n    echo -n (pwd)\n    set_color normal\n    echo -n \"> \"\nend\n" && \
    mkdir -p /etc/fish/functions /etc/fish/conf.d && \
    printf "%s" "$FISH_PROMPT" >> /etc/fish/functions/fish_prompt.fish && \
    printf "if type code-insiders > /dev/null 2>&1; and not type code > /dev/null 2>&1\n  alias code=code-insiders\nend" >> /etc/fish/conf.d/code_alias.fish

USER ede
WORKDIR /ede
ENV HOME=/ede \
    USER=ede

VOLUME [ "/var/lib/docker" ]

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
    esbenp.prettier-vscode \
    dbaeumer.vscode-eslint \
    ms-dotnettools.csdevkit \
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
ENV CI=true
ENV NODE_OPTIONS="--max-old-space-size=4096"

RUN npm install -g pnpm@10

WORKDIR /work
COPY . .
RUN pnpm install && \
    pnpm run package --out extension.vsix

FROM extensions AS final
# Increment this to break the docker cache for this stage
ENV CACHE_BUST=1

COPY --from=vscode-extension /work/extension.vsix /tmp/extension.vsix
RUN code-server --extensions-dir=/code-server/extensions --install-extension /tmp/extension.vsix --force

# Additional pipx packages
RUN pipx install \
    uv

COPY fs/usr /usr

ENTRYPOINT [ "code-server" ]
CMD ["--server-data-dir", "/code-server", "--accept-server-license-terms", "--host", "0.0.0.0", "--port", "2999", "--enable-proposed-api", "ybor-studio.ede-vscode", "--log", "trace"]
EXPOSE 2999
