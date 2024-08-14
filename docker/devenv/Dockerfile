FROM debian:stable-slim

# Install required packages
RUN apt-get update && apt-get install -y \
    zsh git curl wget neovim bash python3 python3-pip rustc cargo make unzip protobuf-compiler

# Install Starship
RUN curl -fsSL https://starship.rs/install.sh | sh -s -- --yes

# Install Macchina
RUN cargo install macchina --locked

# Install Atuin
RUN curl --proto '=https' --tlsv1.2 -LsSf https://setup.atuin.sh | sh

# Set Zsh as the default shell
RUN chsh -s /bin/zsh

# Set up configuration directories
RUN mkdir -p /root/.config/atuin /root/.config/macchina /root/.config/macchina/themes /root/.config/nvim

# Copy the sysinit submodule to the specified folder
COPY deps/sysinit /root/github/roshbhatia/sysinit

# Copy configuration files
COPY deps/sysinit/atuin/config.toml /root/.config/atuin/config.toml
COPY deps/sysinit/zsh/.zshrc.alpine /root/.zshrc
COPY deps/sysinit/starship/starship.toml /root/.config/starship.toml
COPY deps/sysinit/macchina/themes/nike.ascii /root/.config/macchina/themes/nike.ascii
COPY deps/sysinit/macchina/themes/nike.toml /root/.config/macchina/themes/nike.toml
COPY deps/sysinit/macchina/themes/rosh.ascii /root/.config/macchina/themes/rosh.ascii
COPY deps/sysinit/macchina/themes/rosh.toml /root/.config/macchina/themes/rosh.toml
COPY deps/sysinit/grugnvim /root/.config/nvim

# Set the working directory
WORKDIR /root

# Start Zsh interactively when the container launches
CMD ["zsh", "-i"]