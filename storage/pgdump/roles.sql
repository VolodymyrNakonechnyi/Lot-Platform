--
-- PostgreSQL database cluster dump
--

\restrict 6tqEi5WIS5mhOD4MYCfjE2ciqU8f9zYQv0zU4o2zmLtUG1hrrficdfgnN3aXst0

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Roles
--

CREATE ROLE "user";
ALTER ROLE "user" WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:/v/5DtLLg+QuM2LrvkBeuw==$RXICq3YCsjzYxYFVJQnaaYFAEUGEEnoZMVyW0mD8An0=:Ny4YMLzA4M3vzbXKcfqZOTyml8bsqbEJ9SFEmLRUw8E=';

--
-- User Configurations
--






\unrestrict 6tqEi5WIS5mhOD4MYCfjE2ciqU8f9zYQv0zU4o2zmLtUG1hrrficdfgnN3aXst0

--
-- PostgreSQL database cluster dump complete
--

