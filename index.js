const express = require("express");
const cors = require("cors");
const uuid = require("uuid");
const body_parser = require("body-parser");
const cookieParser = require('cookie-parser');
const fetch = require("node-fetch");

const MainAuthorizationKey = process.env.APPROVED_AUTHORIZATION_KEY;
const port = process.env.PORT || 443;
const app = express();

var versionNumber = "1.0"

function errorHappened(req, err) {
    console.log(`Request #${req.efazdev_api_key} had an error: ${err.message}`)
}

function setStatus(req, res, code) {
    if (code == 204) { return; }
    if (!(req.get("roblox-id"))) {
        res.status(code)
    }
}

function isNumber(s) {
    for (let i = 0; i < s.length; i++) {
        if (s[i] < '0' || s[i] > '9') {
            return false;
        }
    }
    return true;
}

app.use(cors());
app.use(cookieParser());
app.use(body_parser.json({ limit: '10mb' }));
app.use(body_parser.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
    ip_address = JSON.stringify(req.header('do-connecting-ip') || req.socket.remoteAddress);
    generated_key = uuid.v4()
    res.header("X-API", generated_key)

    req.efazdev_api_key = generated_key

    console.log(`${req.url} | Type: ${req.method} | Token: ${generated_key}`);
    next()
});

app.all("/", (req, res) => {
    try {
        setStatus(req, res, 200)
        res.json({ "success": true, "message": "OK", "code": 200 })
    } catch (e) {
        errorHappened(req, e)
        setStatus(req, res, 500)
        res.json({
            "success": false,
            "message": "Something went wrong!",
            "code": 500
        });
    }
});

app.get("/scan/:id", (req, res) => {
    try {
        if (req.get("X-Authorization-Key") == MainAuthorizationKey) {
            try {
                var link = `https://friends.roblox.com/v1/users/${req.params.id}/followings?sortOrder=Desc&limit=100`
                if (req.query.cursor) {
                    link = `${link}?cursor=${req.query.cursor}`
                }
                fetch(link, {
                    "method": "GET"
                }).then((new_res) => {
                    setStatus(req, res, new_res.status)
                    if (new_res.ok) {
                        if (new_res.headers.get("Content-Type") && new_res.headers.get("Content-Type").includes("application/json")) {
                            new_res.json().then(new_json => {
                                if (new_json["errors"]) {
                                    res.json({
                                        "success": false,
                                        "message": "Roblox responded with an error. Try again later!",
                                        "response": new_json,
                                        "code": new_res.status
                                    });
                                } else {
                                    res.json({
                                        "success": true,
                                        "message": "Success!",
                                        "response": new_json,
                                        "code": new_res.status
                                    });
                                }
                            }).catch((err) => {
                                res.json({
                                    "success": false,
                                    "message": "Something went wrong!",
                                    "response": {
                                        "message": "System Error"
                                    },
                                    "code": new_res.status
                                });
                                errorHappened(req, err)
                            });
                        } else {
                            new_res.text().then(new_text => {
                                res.json({
                                    "success": true,
                                    "message": "Success!",
                                    "response": new_text,
                                    "code": new_res.status
                                });
                            }).catch((err) => {
                                res.json({
                                    "success": false,
                                    "message": "Something went wrong!",
                                    "response": {
                                        "message": "System Error"
                                    },
                                    "code": new_res.status
                                });
                                errorHappened(req, err)
                            });
                        }
                    } else {
                        if (new_res.headers.get("Content-Type") && new_res.headers.get("Content-Type").includes("application/json")) {
                            new_res.json().then(new_text => {
                                res.json({
                                    "success": false,
                                    "message": "Roblox responded with an error. Try again later!",
                                    "response": new_text,
                                    "code": new_res.status
                                });
                            }).catch((err) => {
                                res.json({
                                    "success": false,
                                    "message": "Something went wrong!",
                                    "response": {
                                        "message": "System Error"
                                    },
                                    "code": new_res.status
                                });
                                errorHappened(req, err)
                            });
                        } else {
                            new_res.text().then(new_text => {
                                res.json({
                                    "success": false,
                                    "message": "Roblox responded with an error. Try again later!",
                                    "response": new_text,
                                    "code": new_res.status
                                });
                            }).catch((err) => {
                                res.json({
                                    "success": false,
                                    "message": "Something went wrong!",
                                    "response": {
                                        "message": "System Error"
                                    },
                                    "code": new_res.status
                                });
                                errorHappened(req, err)
                            });
                        }
                    }
                })
                    .catch((err) => {
                        setStatus(req, res, 500)
                        res.json({
                            "success": false,
                            "message": "Something went wrong!",
                            "response": {
                                "message": "System Error"
                            },
                            "code": 500
                        });
                        errorHappened(req, err)
                    });
            } catch (error) {
                setStatus(req, res, 500)
                errorHappened(req, error)
                res.json({
                    "success": false,
                    "message": "Something went wrong!",
                    "code": 500
                });
            }
        } else {
            setStatus(req, res, 403)
            if (req.get("X-Authorization-Key")) {
                res.json({
                    "success": false,
                    "message": "You have provided an invalid authorization key for this service. Please provide a valid key using the X-Authorization-Key header!",
                    "code": 403
                });
            } else {
                res.json({
                    "success": false,
                    "message": "You haven't provided an authorization key for this service. Please provide a valid key using the X-Authorization-Key header!",
                    "code": 403
                });
            }
        }
    } catch (e) {
        setStatus(req, res, 500)
        errorHappened(req, e)
        res.json({
            "success": false,
            "message": "Something went wrong!",
            "code": 500
        });
    }
});

app.use((err, req, res, next) => {
    errorHappened(req, err)
    setStatus(req, res, 500)
    res.json({ "success": false, "message": "Something went wrong!", "code": 500 })
})
app.use(function (req, res) {
    setStatus(req, res, 404)
    res.json({ "success": false, "message": "API Not Found!", "code": 404 })
});

app.listen(port, () => {
    console.log(`
  EfazDev Follow API v${versionNumber}
  Running on port: ${port}

  Console Logs:
  `)
});