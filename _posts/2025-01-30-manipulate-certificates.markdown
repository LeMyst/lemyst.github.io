---
title: "Manipulating Certificates with OpenSSL"
author: myst
date: 2025-01-30 13:00:00 +0100
last_modified_at: 2026-06-17 13:00:00 +0100
categories: [ security ]
tags: [ openssl, certificates, encryption, decryption, signing, verification ]
---

When working with certificates, you may need to perform various operations such as creating, signing, verifying, encrypting, or decrypting certificates. OpenSSL is a powerful tool that allows you to manipulate certificates and perform these operations from the command line.

## Prerequisites

Before you begin, make sure you have access to the openssl command-line tool. You can install OpenSSL on various operating systems, including Linux, macOS, and Windows. You can also use a pre-installed version of OpenSSL that comes with your operating system.

## Creating a Private Key

The private key is a crucial component of a certificate that is used for encryption, decryption, signing, and verification. To create a private key using OpenSSL, you can use the following command:

```bash
openssl genrsa -out private.key 4096
```

This command generates a 4096-bit RSA private key and saves it to a file named `private.key`.

### Generating a Private Key with a Passphrase

If you want to protect your private key with a passphrase, you can use the following command:

```bash
openssl genrsa -des3 -out private.key 4096
```

This command generates a 4096-bit RSA private key and encrypts it with the Triple DES algorithm using a passphrase. You will be prompted to enter and confirm the passphrase when running this command.

## Creating a Certificate Signing Request (CSR)

A Certificate Signing Request (CSR) is a request sent to a Certificate Authority (CA) to apply for a digital certificate. To create a CSR using OpenSSL, you can use the following command:

```bash
openssl req -new -key private.key -out csr.pem
```

This command generates a CSR using the private key stored in `private.key` and saves the CSR to a file named `csr.pem`.

## Creating a CSR and the private key in one step

You can also create a CSR and the private key, while also specifying the key size, subject, and other details in one step. To do this, you can use the following command:

```bash
openssl req -new -newkey rsa:4096 -nodes -keyout private.key -out csr.pem -subj "/C=FR/ST=Lyon/L=Lyon/O=Example/CN=example.com"
```

This command generates a 4096-bit RSA private key and a CSR with the specified subject details and saves them to `private.key` and `csr.pem`, respectively.

The parameters `-nodes` and `-newkey rsa:4096` are used to generate a private key without encryption and specify the key size, respectively. The `-subj` parameter is used to specify the subject details of the certificate.

## Reading a Certificate Signing Request (CSR)

To view the information contained in a CSR, such as the subject details and the public key, you can use the following command:

```bash
openssl req -in csr.pem -text -noout
```

This command displays detailed information about the CSR stored in `csr.pem`. The parameters `-text` and `-noout` are used to display the text output and suppress the encoded CSR itself, for easier readability.

You can also verify that the CSR is valid and that its signature matches the public key it contains with the following command:

```bash
openssl req -in csr.pem -verify -noout
```

## Adding Subject Alternative Names (SAN)

Modern clients, such as web browsers, ignore the Common Name (CN) and rely on the Subject Alternative Name (SAN) extension to validate the hostnames a certificate is issued for. A certificate without a SAN is generally rejected, so you should add one when generating a CSR or a self-signed certificate.

You can pass the extension directly on the command line using the `-addext` parameter:

```bash
openssl req -new -newkey rsa:4096 -nodes -keyout private.key -out csr.pem -subj "/C=FR/ST=Lyon/L=Lyon/O=Example/CN=example.com" -addext "subjectAltName=DNS:example.com,DNS:www.example.com,IP:192.168.1.10"
```

This command generates a CSR that is valid for the hostnames `example.com` and `www.example.com`, as well as the IP address `192.168.1.10`. You can list as many `DNS:` and `IP:` entries as needed, separated by commas.

The same `-addext` parameter can be used when creating a self-signed certificate:

```bash
openssl req -x509 -newkey rsa:4096 -nodes -keyout private.key -out certificate.crt -days 365 -subj "/CN=example.com" -addext "subjectAltName=DNS:example.com,DNS:www.example.com"
```

## Using a Configuration File

Passing every detail on the command line quickly becomes tedious and hard to repeat, especially when you need several Subject Alternative Names. Instead, you can describe the request in a configuration file and reuse it. Create a file named `csr.cnf` with the following content:

```ini
[ req ]
default_bits       = 4096
prompt             = no
default_md         = sha256
distinguished_name = dn
req_extensions     = req_ext

[ dn ]
C  = FR
ST = Lyon
L  = Lyon
O  = Example
CN = example.com

[ req_ext ]
subjectAltName = @alt_names

[ alt_names ]
DNS.1 = example.com
DNS.2 = www.example.com
IP.1  = 192.168.1.10
```

The `prompt = no` setting tells OpenSSL to read the subject from the `[ dn ]` section instead of asking interactively, and the `[ alt_names ]` section lists all the hostnames and IP addresses the certificate should be valid for.

To generate a CSR (and a new private key) using this configuration file, run:

```bash
openssl req -new -newkey rsa:4096 -nodes -keyout private.key -out csr.pem -config csr.cnf
```

This command generates a private key and a CSR that includes the subject and the Subject Alternative Names defined in `csr.cnf`.

You can also create a self-signed certificate directly from the same configuration file. The `-extensions` parameter is required so that the SAN section is included in the certificate itself:

```bash
openssl req -x509 -newkey rsa:4096 -nodes -keyout private.key -out certificate.crt -days 365 -config csr.cnf -extensions req_ext
```

Reusing a configuration file ensures that every certificate you generate is consistent and avoids typing long commands by hand.

## Creating a Self-Signed Certificate

A self-signed certificate is a certificate that is signed by the same entity that issued it. To create a self-signed certificate using OpenSSL, you can use the following command:

```bash
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365
```

This command generates a 4096-bit RSA private key and a self-signed certificate with a validity period of 365 days. The private key is stored in `private.key`, and the certificate is stored in `certificate.crt`.

It can be used as a root certificate for testing purposes, but it is not recommended for production use.

## Creating a PKCS#12 File

A PKCS#12 file is a binary format that can store a private key, a certificate, and other certificates in a single file. To create a PKCS#12 file using OpenSSL, you can use the following command:

```bash
openssl pkcs12 -export -in certificate.crt -inkey private.key -out certificate.p12
```

This command creates a PKCS#12 file named `certificate.p12` containing the certificate stored in `certificate.crt` and the private key stored in `private.key`.

## Extracting the Public Key

The public key can be derived from a private key. To extract the public key from a private key, you can use the following command:

```bash
openssl rsa -in private.key -pubout -out public.key
```

This command extracts the public key from the private key stored in `private.key` and saves it to a file named `public.key`.

You can also extract the public key from a certificate:

```bash
openssl x509 -in certificate.crt -pubkey -noout -out public.key
```

This command extracts the public key embedded in the certificate stored in `certificate.crt` and saves it to `public.key`.

## Viewing Certificate Information

To view the information contained in a certificate, you can use the following command:

```bash
openssl x509 -in certificate.crt -text -noout
```

This command displays detailed information about the certificate stored in `certificate.crt`.

Or if you want to view the information in a PKCS#12 file, you can use the following command:

```bash
openssl pkcs12 -info -in certificate.p12
```

The parameters `-text` and `-noout` are used to display the text output and suppress the certificate itself, for easier readability.

## Verifying a Certificate

To verify that a certificate is valid and was issued by a trusted Certificate Authority (CA), you can use the following command:

```bash
openssl verify -CAfile ca.crt certificate.crt
```

This command checks the certificate stored in `certificate.crt` against the CA certificate stored in `ca.crt`. If the certificate is valid, the command outputs `certificate.crt: OK`.

If the certificate was issued through one or more intermediate CAs, you can provide the intermediate certificates with the `-untrusted` parameter:

```bash
openssl verify -CAfile ca.crt -untrusted intermediate.crt certificate.crt
```

## Checking a Certificate's Expiration Date

To check when a certificate expires, you can use the following command:

```bash
openssl x509 -enddate -noout -in certificate.crt
```

This command displays the expiration date of the certificate stored in `certificate.crt`, for example `notAfter=Jan 30 13:00:00 2026 GMT`.

You can also check whether a certificate will expire within a given period (in seconds). For example, to check if it expires within the next 30 days:

```bash
openssl x509 -checkend 2592000 -noout -in certificate.crt
```

This command returns `Certificate will not expire` or `Certificate will expire` depending on the result.

## Verifying that a Key, CSR and Certificate Match

When deploying a certificate, it is common to make sure that the private key, the CSR and the certificate all belong together. They do if they share the same modulus. To compare them, you can compute a hash of each modulus and check that the values are identical:

```bash
openssl rsa -noout -modulus -in private.key | openssl md5
openssl req -noout -modulus -in csr.pem | openssl md5
openssl x509 -noout -modulus -in certificate.crt | openssl md5
```

If the three commands produce the same hash, the private key, the CSR and the certificate match.

## Read a certificate from a remote server

To read a certificate from a remote server, you can use the following command:

```bash
openssl s_client -connect example.com:443 -showcerts
```

This command connects to the server `example.com` on port `443` and retrieves the certificate chain. The `-showcerts` option displays the certificates in the chain.

You can view the certificate digest on the line "Peer signing digest: SHA256" and the key length on the line "Server public key is XXX bit".

## Converting Between Formats

Certificates and keys can be stored in different encodings, mainly PEM (Base64, human-readable) and DER (binary). Some systems also bundle everything into a PKCS#12 file. OpenSSL can convert between these formats.

To convert a certificate from PEM to DER:

```bash
openssl x509 -in certificate.crt -outform der -out certificate.der
```

To convert a certificate from DER back to PEM:

```bash
openssl x509 -inform der -in certificate.der -outform pem -out certificate.crt
```

To extract the private key from a PKCS#12 file:

```bash
openssl pkcs12 -in certificate.p12 -nocerts -nodes -out private.key
```

To extract the certificate from a PKCS#12 file:

```bash
openssl pkcs12 -in certificate.p12 -clcerts -nokeys -out certificate.crt
```

The `-nocerts` and `-nokeys` parameters select only the keys or only the certificates, respectively, while `-nodes` extracts the private key without encrypting it.

## Determining the type of a file

Files generated by the OpenSSL command line tool can be in various formats, such as PEM, DER, or PKCS#12. To determine the type of a file, you can use the following command:

You can determine the type by looking at the first few characters of the file.

If the file starts with `-----BEGIN CERTIFICATE-----`, it is a PEM file containing a certificate.

If the file starts with `-----BEGIN PRIVATE KEY-----`, it is a PEM file containing a non-encrypted private key.

If the file starts with `-----BEGIN ENCRYPTED PRIVATE KEY-----`, it is a PEM file containing an encrypted private key, you need a passphrase to decrypt it.

