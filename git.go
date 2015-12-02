package main

import (
	"bufio"
	"bytes"
	"errors"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"strings"
	"syscall"
)

func host() string {
	if host := os.Getenv("HEROKU_HOST"); host != "" {
		return host
	}
	return "heroku.com"
}

func apiHost() string {
	h := host()
	if strings.HasPrefix(h, "http") {
		u, err := url.Parse(h)
		if err != nil {
			Errln(err)
		} else {
			return u.Host
		}
	}
	return "api." + host()
}

func apiURL() string {
	h := host()
	if strings.HasPrefix(h, "http") {
		return h
	}
	return "https://api." + h
}

func gitHost() string {
	if host := os.Getenv("HEROKU_GIT_HOST"); host != "" {
		return host
	}
	h := host()
	if strings.HasPrefix(h, "http") {
		u, err := url.Parse(h)
		if err != nil {
			Errln(err)
		} else {
			return u.Host
		}
	}
	return h
}

func httpGitHost() string {
	if host := os.Getenv("HEROKU_HTTP_GIT_HOST"); host != "" {
		return host
	}
	h := host()
	if strings.HasPrefix(h, "http") {
		u, err := url.Parse(h)
		if err != nil {
			Errln(err)
		} else {
			return u.Host
		}
	}
	return "git." + host()
}

func gitURLPre() string {
	return "git@" + gitHost() + ":"
}

func gitAltURLPre() string {
	return "ssh://git@" + gitHost() + "/"
}

func gitHTTPSURLPre() string {
	return "https://" + httpGitHost() + "/"
}

func gitRemotes() (map[string]string, error) {
	b, err := exec.Command("git", "remote", "-v").CombinedOutput()
	if err != nil {
		return nil, errors.New(string(b))
	}

	return parseGitRemoteOutput(b)
}

func appNameFromGitURL(remote string) string {
	switch {
	case strings.HasPrefix(remote, gitHTTPSURLPre()) && strings.HasSuffix(remote, ".git"):
		return remote[len(gitHTTPSURLPre()) : len(remote)-len(".git")]
	case strings.HasPrefix(remote, gitURLPre()) && strings.HasSuffix(remote, ".git"):
		return remote[len(gitURLPre()) : len(remote)-len(".git")]
	case strings.HasPrefix(remote, gitAltURLPre()) && strings.HasSuffix(remote, ".git"):
		return remote[len(gitAltURLPre()) : len(remote)-len(".git")]
	default:
		return ""
	}
}

func parseGitRemoteOutput(b []byte) (results map[string]string, err error) {
	s := bufio.NewScanner(bytes.NewBuffer(b))
	s.Split(bufio.ScanLines)

	results = make(map[string]string)

	for s.Scan() {
		by := s.Bytes()
		f := bytes.Fields(by)
		if len(f) != 3 || string(f[2]) != "(push)" {
			// this should have 3 tuples + be a push remote, skip it if not
			continue
		}

		if appName := appNameFromGitURL(string(f[1])); appName != "" {
			results[string(f[0])] = appName
		}
	}
	if err = s.Err(); err != nil {
		return nil, err
	}
	return
}

func remoteFromGitConfig() string {
	b, err := exec.Command("git", "config", "heroku.remote").Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(b))
}

func errMultipleHerokuRemotes(remotes []string) error {
	return errors.New("multiple apps in git remotes\nremotes: " + strings.Join(remotes, " "))
}

func appFromGitRemote(remote string) (string, error) {
	if remote != "" {
		b, err := exec.Command("git", "config", "remote."+remote+".url").Output()
		if err != nil {
			if isNotFound(err) {
				wdir, _ := os.Getwd()
				remotes, err := gitRemotes()
				if err != nil {
					return "", err
				}
				msg := fmt.Sprintf("could not find git remote %s in %s", remote, wdir)
				if len(remotes) != 0 {
					msg = fmt.Sprintf("%s\nremotes: %s", msg, strings.Join(mapKeys(remotes), " "))
				}
				return "", errors.New(msg)
			}
			return "", err
		}

		out := strings.TrimSpace(string(b))

		appName := appNameFromGitURL(out)
		if appName == "" {
			return "", fmt.Errorf("could not find app name in " + remote + " git remote")
		}
		return appName, nil
	}

	// no remote specified, see if there is a single Heroku app remote
	remotes, err := gitRemotes()
	if err != nil {
		return "", nil // hide this error
	}
	remoteValues := uniqueMapValues(remotes)
	if len(remoteValues) > 1 {
		return "", errMultipleHerokuRemotes(mapKeys(remotes))
	}
	for _, v := range remotes {
		return v, nil
	}
	return "", nil
}

func uniqueMapValues(m map[string]string) []string {
	n := make([]string, 0, len(m))
	ref := make(map[string]bool, len(m))
	for _, v := range m {
		if _, ok := ref[v]; !ok {
			ref[v] = true
			n = append(n, v)
		}
	}
	return n
}

func mapKeys(m map[string]string) []string {
	n := make([]string, 0, len(m))
	for k := range m {
		n = append(n, k)
	}
	return n
}

func isNotFound(err error) bool {
	if ee, ok := err.(*exec.ExitError); ok {
		if ws, ok := ee.ProcessState.Sys().(syscall.WaitStatus); ok {
			return ws.ExitStatus() == 1
		}
	}
	return false
}
