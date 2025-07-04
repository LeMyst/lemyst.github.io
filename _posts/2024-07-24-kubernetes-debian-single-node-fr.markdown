---
title: "Kubernetes sur un unique noeud Debian"
author: myst
date: 2024-07-24 22:15:00 +0200
last_modified_at: 2025-06-25 17:30:00 +0200
categories: [ kubernetes ]
tags: [ kubernetes, debian, single-node, cluster, nfs, cilium, calico, metrics-server, kubelet-csr-approver ]
lang: fr
---

## Introduction

Ce billet est inspiré de l'article en
anglais [Deploying Kubernetes Onto A Single Debian 12.1 Host](https://www.bentasker.co.uk/posts/documentation/linux/building-a-k8s-cluster-on-debian-12-1-bookworm.html)
écrit par [Ben Tasker](https://www.bentasker.co.uk/).<br>
J'essaierai de le garder à jour avec les dernières versions de Kubernetes et Debian.

## Prérequis

Voici les prérequis attendus pour ce guide :

* Un serveur Debian "Bookworm" 12 (12.11 au moment de l'écriture)
* Une IP statique pour le nœud maître
* Un utilisateur avec des privilèges sudo
* Un accès à Internet
* Un serveur NFS pour le stockage des données (optionnel)

## Configuration du système

Il est nécessaire d'effectuer certaines actions avant de pouvoir commencer à installer Kubernetes.

Premièrement, assurez-vous que votre système est à jour et que les paquets nécessaires sont installés :

Vous n'avez besoin du paquet `jq` que pendant ce guide, vous pouvez le supprimer après l'installation de Kubernetes et
la configuration du nœud unique.

```terminal
sudo apt update
sudo apt install -y curl jq gnupg2
```

(Optionnel) Pour certains éléments optionnels de ce guide, vous aurez besoin de `helm` :

```terminal
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
chmod 700 get_helm.sh
./get_helm.sh
```

Désactivation du swap, même si Kubernetes peut fonctionner avec le swap dans ses dernières versions, il est recommandé de le désactiver :

```terminal
sudo swapoff -a
sudo sed -i '/ swap / s/^[^#]/#&/' /etc/fstab
```

Activation du routage des paquets IPv4 :

```terminal
cat <<EOF | sudo tee /etc/sysctl.d/99-kubernetes-k8s.conf
net.ipv4.ip_forward = 1
EOF

sudo sysctl --system
```

Installation de `containerd` :

```terminal
sudo apt update
sudo apt install -y containerd
```

Création du fichier de configuration de `containerd` :

```terminal
sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml
```

Remplacement de la valeur de `SystemdCgroup` de `false` à `true` dans la
section `plugins."io.containerd.grpc.v1.cri".containerd.runtimes.runc.options`.  
Cela permet à `containerd` de fonctionner correctement avec `systemd` :

```terminal
cat /etc/containerd/config.toml | sed 's/SystemdCgroup = false/SystemdCgroup = true/' | sudo tee /etc/containerd/config.toml
```

Activation et redémarrage de `containerd` :

```terminal
sudo systemctl enable containerd
sudo systemctl restart containerd
```

## Installation de Kubernetes

Il est temps d'installer Kubernetes.

Ajoutez la clé GPG de Kubernetes, vous pouvez remplacer `v1.33` par la version de Kubernetes que vous souhaitez
installer :

```terminal
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.33/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
```

Dans les versions avant Debian 12 et Ubuntu 22.04, vous devez créer le répertoire `/etc/apt/keyrings` avant d'exécuter
la commande `curl` précédente.

Ajoutez le dépôt Kubernetes, vous pouvez remplacer `v1.33` par la version de Kubernetes que vous souhaitez installer :

```terminal
cat <<EOF | sudo tee /etc/apt/sources.list.d/kubernetes.list
deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.33/deb/ /
EOF
```

Installez les paquets nécessaires :

```terminal
sudo apt update
sudo apt install -y kubeadm kubelet kubectl
```

Bloquez les mises à jour automatiques des paquets :

```terminal
sudo apt-mark hold kubeadm kubelet kubectl
```

## Initialisation du nœud maître

Récupérez les images nécessaires pour Kubernetes :

```terminal
sudo kubeadm config images pull
```

Initialisez le nœud maître en utilisant son IP :

```terminal
sudo kubeadm init --control-plane-endpoint=$(hostname -I | awk '{print $1}')
```

Cela va prendre un certain temps. Une fois terminé, vous verrez le message suivant : `Your Kubernetes control-plane has initialized successfully!`

S'il ne s'est pas initialisé correctement, consultez la section [Debugging](#Debugging) à la fin de ce guide.

Pour configurer `kubectl` pour votre utilisateur, exécutez les commandes suivantes :

```terminal
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

Vous devez maintenant pouvoir interagir avec votre cluster Kubernetes sans utiliser `sudo` :

```terminal
kubectl get nodes
```

(optionnel) Si vous le souhaitez, vous pouvez activer l'autocomplétion pour `kubectl` et l'ajouter à votre
fichier `.bashrc` :

```terminal
source <(kubectl completion bash)
echo "source <(kubectl completion bash)" | tee -a ~/.bashrc
```

## Installation du réseau

Pour que les Pods puissent communiquer entre eux, vous devez installer un réseau.
Plusieurs solutions sont disponibles, mais les plus courantes sont `cilium`, `calico` et `flannel`.
Cette action ne doit être effectuée qu'une seule fois, après l'initialisation du nœud maître.

### Utilisation de cilium

L'installation de cilium nécessite d'avoir `cilium` sur votre machine.

Téléchargement de la dernière version de `cilium` :

```terminal
CILIUM_CLI_VERSION=$(curl -s https://raw.githubusercontent.com/cilium/cilium-cli/main/stable.txt)
CLI_ARCH=amd64
if [ "$(uname -m)" = "aarch64" ]; then CLI_ARCH=arm64; fi
curl -L --fail --remote-name-all https://github.com/cilium/cilium-cli/releases/download/${CILIUM_CLI_VERSION}/cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
sha256sum --check cilium-linux-${CLI_ARCH}.tar.gz.sha256sum
sudo tar xzvfC cilium-linux-${CLI_ARCH}.tar.gz /usr/local/bin
rm cilium-linux-${CLI_ARCH}.tar.gz{,.sha256sum}
```

Vérification de l'installation du client `cilium` :

```terminal
cilium version --client
```

Installation de `cilium` sur le cluster avec la dernière version disponible :

```terminal
cilium install
```

Il est possible de spécifier une version spécifique de `cilium` lors de l'installation :

```terminal
cilium install --version v1.16.1
```

Validation de l'installation, cela peut prendre quelques minutes avant que tout soit prêt :

```terminal
cilium status --wait
```

Test de connectivité, à faire après que vous avez configuré le cluster en tant que nœud unique ou si vous avez ajouté des
nœuds :

```terminal
cilium connectivity test
```

### Utilisation de calico

Vous pouvez également utiliser calico comme réseau pour votre cluster Kubernetes à la place de cilium.

Il suffit d'appliquer le manifeste suivant, qui installe la version 3.29.2 de calico :

```terminal
kubectl apply -f https://raw.githubusercontent.com/projectcalico/calico/v3.29.2/manifests/calico.yaml
```

Vous pouvez trouver la dernière version disponible, vous pouvez consulter la page
suivante : [https://github.com/projectcalico/calico/releases/latest](https://github.com/projectcalico/calico/releases/latest)

## Configuration en tant que nœud unique

Jusqu'à présent, tout ce qui a été fait n'était pas spécifique pour un nœud unique. Cependant, il y a quelques
ajustements à faire pour que Kubernetes fonctionne correctement sur un seul nœud.

Sans les autres nœuds, il est impossible d'exécuter quoi que ce soit dans le cluster car Kubernetes applique un `taint`
sur le nœud maître pour qu'aucun Pod ne puisse y être planifié. Pour contourner cela, vous pouvez supprimer le `taint` :

Affichez les `taints` de votre unique nœud :

```terminal
kubectl get nodes -o json | jq '.items[].spec.taints'
```

Cela devrait afficher quelque chose comme :

```json
[
  {
    "effect": "NoSchedule",
    "key": "node-role.kubernetes.io/control-plane"
  }
]
```

(Si vous avez installé une ancienne version, le taint peut se présenter sous la forme `node-role.kubernetes.io/master`)

On supprime le `taint` :

```terminal
kubectl taint nodes $HOSTNAME node-role.kubernetes.io/control-plane:NoSchedule-
```

(Notez le `-` à la fin de la commande pour supprimer le `taint`)

Si vous récupérez à nouveau les `taints`, vous devriez voir que le `taint` a été supprimé.

```terminal
kubectl get nodes -o json | jq '.items[].spec.taints'
```

Après quelques instants, vous devriez voir que vos Pods sont en cours d'exécution :

```terminal
kubectl get pods --all-namespaces
```

Si vous avez installé `cilium`, vous pouvez maintenant vérifier le bon fonctionnement de la connectivité.

## Ajout d'un StorageClass NFS

Pour plus de simplicité, j'utilise un fournisseur de stockage NFS pour mes déploiements, qui s'occupe de tout stocker
dans un sous-dossier d'un partage NFS.

Vous pouvez trouver plus d'informations sur le GitHub du
projet [nfs-subdir-external-provisioner](https://github.com/kubernetes-sigs/nfs-subdir-external-provisioner).

L'approche la plus pratique est d'utiliser Helm pour installer le fournisseur NFS.

Vous devez dans un premier temps installer le client NFS, cette étape doit être effectuée sur tous les nœuds existants
et futurs, n'oubliez pas d'autoriser ces nœuds à accéder au serveur NFS :

```
sudo apt update
sudo apt install -y nfs-common
```

Ensuite, installez le fournisseur NFS avec Helm :

```terminal
helm repo add nfs-subdir-external-provisioner https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/
helm install nfs-subdir-external-provisioner nfs-subdir-external-provisioner/nfs-subdir-external-provisioner \
    --namespace kube-infra \
    --create-namespace \
    --set nfs.server=<IP SERVEUR NFS> \
    --set nfs.path=/exported/path
```

Si vous avez un doute sur le chemin NFS à utiliser, vous pouvez le trouver en exécutant la commande suivante :

```terminal
sudo showmount -e <IP SERVEUR NFS>
```

(optionnel) Si vous souhaitez utiliser le StorageClass NFS par défaut, vous pouvez le définir comme suit :

```terminal
kubectl patch storageclass nfs-client -p '{"metadata": {"annotations":{"storageclass.kubernetes.io/is-default-class":"true"}}}'
```

## Installation de kubelet-csr-approver

Dans le but de simplifier la gestion des certificats, mais aussi pour le fonctionnement correct du metrics-server, il
est intéressant d'installer kubelet-csr-approver.

Pour ce faire, vous pouvez utiliser le helm chart suivant :

```terminal
helm repo add kubelet-csr-approver https://postfinance.github.io/kubelet-csr-approver
helm install kubelet-csr-approver kubelet-csr-approver/kubelet-csr-approver -n kube-system \
  --set providerIpPrefixes='10.6.9.0/24' \
  --set bypassDnsResolution='true'
```

Le paramètre `providerIpPrefixes` permet de spécifier les plages d'adresses IP autorisées à approuver les certificats.
Le second paramètre `bypassDnsResolution`, défini à `true`, permet de ne pas résoudre les noms de domaine.

Vous avez la possibilité de spécifier d'autres paramètres, vous pouvez consulter la documentation du projet à l'adresse
suivante : [https://github.com/postfinance/kubelet-csr-approver?tab=readme-ov-file#parameters](https://github.com/postfinance/kubelet-csr-approver?tab=readme-ov-file#parameters)

## Activation du serverTLSBootstrap

Le serverTLSBootstrap est une fonctionnalité permettant aux nœuds de générer leurs propres certificats pour communiquer
avec le cluster.

Pour activer cette fonctionnalité, vous devez ajouter les paramètres suivants dans le fichier de configuration de
kubelet sur chaque nœud :

```terminal
echo "serverTLSBootstrap: true" | sudo tee -a /var/lib/kubelet/config.yaml && sudo systemctl restart kubelet
```

Cela va générer un CSR (Certificate Signing Request) pour chaque nœud, que kubelet-csr-provider va approuver
automatiquement.

Vous pouvez voir les certificats approuvés en exécutant la commande suivante :

```terminal
kubectl get csr
```

## Installation de metrics-server

Le metrics-server est un composant qui collecte les métriques de l'ensemble du cluster Kubernetes. Il est nécessaire
pour que les HPA (Horizontal Pod Autoscaler) ou la commande `kubectl top` fonctionnent.

Pour l'installer, vous pouvez utiliser le manifeste suivant :

```terminal
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

## Ajout de nœuds supplémentaires

Si vous souhaitez ajouter d'autres nœuds à votre cluster, vous pouvez utiliser la commande `kubeadm join` :

```terminal
sudo kubeadm join <noeud maitre>:6443 --token <token> --discovery-token-ca-cert-hash sha256:<hash>
```

Vous pouvez obtenir le token et le hash en exécutant la commande suivante sur le nœud maître :

```terminal
sudo kubeadm token create --print-join-command
```

(optionnel) Remise en place du `taint` sur le nœud maître :

```terminal
sudo kubectl taint nodes $HOSTNAME node-role.kubernetes.io/control-plane:NoSchedule
```

(optionnel) Installation de NFS sur le nœud nouvellement ajouté :

```terminal
sudo apt update
sudo apt install -y nfs-common
```

Ajout du kubeconfig sur le nœud nouvellement ajouté :

```terminal
mkdir -p $HOME/.kube
```

Copiez le fichier de configuration /etc/kubernetes/admin.conf du nœud maître dans le fichier $HOME/.kube/config du nœud
nouvellement ajouté :

```terminal
nano $HOME/.kube/config
```

Puis modifiez les droits :

```terminal
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

# Debugging

Si vous rencontrez des problèmes lors de l'installation ou de l'utilisation de Kubernetes, vous pouvez consulter les journaux de `kubelet` pour obtenir des informations supplémentaires :

```terminal
sudo journalctl -xeu kubelet
```

Vous pouvez aussi réinitialiser le nœud en exécutant la commande suivante, ce qui aura pour effet de remettre le nœud dans son état initial :

```terminal
sudo kubeadm reset
```
