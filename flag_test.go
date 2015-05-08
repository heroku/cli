package main

import "testing"

var verboseFlag = &Flag{
	Name:     "verbose",
	Char:     "v",
	HasValue: false,
}

func checkFlag(t *testing.T, flag *Flag, input, expectedValue, expectedError string) {
	out, val, err := parseFlag(input, []*Flag{flag})
	if expectedError != "" {
		if expectedError != err.Error() {
			t.Error(err)
		}
		return
	}
	if err != nil {
		t.Error(err)
	}
	if flag != out {
		t.Error(flag, "not returned")
	}
	if val != expectedValue {
		t.Error(expectedValue + " not returned")
	}
}

func TestParseFlag(t *testing.T) {
	checkFlag(t, appFlag, "-amyapp", "myapp", "")
	checkFlag(t, appFlag, "--app=myapp", "myapp", "")
	checkFlag(t, appFlag, "--app=myapp=app", "myapp=app", "")
	checkFlag(t, appFlag, "-a=myapp", "myapp", "")
	checkFlag(t, appFlag, "-amyapp", "myapp", "")
	checkFlag(t, appFlag, "--app", "", " -a, --app APP needs a value")
	checkFlag(t, verboseFlag, "--verbose", "", "")
	checkFlag(t, verboseFlag, "--verbose=foo", "", " -v, --verbose does not take a value")
	checkFlag(t, verboseFlag, "-v", "", "")
}
