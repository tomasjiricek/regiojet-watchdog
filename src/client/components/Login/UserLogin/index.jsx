import React, { Component, Fragment } from 'react';
import Login from './Login';
import request from '../../../utils/request';
import Register from './Register';

import './userLogin.css';

const ERROR_TIMEOUT = 4000;
const ERROR_TYPE = {
    USER_NOT_FOUND: 1,
    CANNOT_CREATE_USER: 2,
    REQUEST_FAILED: 3
}

export default class UserLogin extends Component {
    constructor(props) {
        super(props);
        this.errorTimeout = null;
        this.state = {
            errpr: null,
            registrationView: false
        };
    }

    handleLoginSubmit = (securityImageIndex, knockCodeData) => {
        const encodedData = this.encodeLoginData(securityImageIndex, knockCodeData);
        const req = request('/api/user-login');
        const body = JSON.stringify({ token: encodedData });
        req.usePost();
        req.send({ body }).then((res) => {
            if (res.status === 200) {
                res.json().then((data) => {
                    this.handleLoginSuccess(data.data);
                });
                return;
            }
            this.handleLoginFailed(res);
        });
    }

    handleRegisterSubmit = (securityImageIndex, knockCodeData) => {
        const encodedData = this.encodeLoginData(securityImageIndex, knockCodeData);
        const req = request('/api/user-register');
        const body = JSON.stringify({ token: encodedData });
        req.usePost();
        req.send({ body }).then((res) => {
            if (res.status === 200) {
                res.json().then((data) => {
                    this.handleRegisterSuccess(data.data);
                });
                return;
            }
            this.handleRegisterFailed(res);
        });
    }

    handleLoginSuccess = (data) => {
        this.props.onLogIn(data);
    }

    handleLoginFailed = (res) => {
        this.forceUpdateNestedComponent();
        this.setError(res.status === 403 ? ERROR_TYPE.USER_NOT_FOUND : ERROR_TYPE.REQUEST_FAILED);
    }

    handleRegisterSuccess = (data) => {
        this.props.onRegister(data);
    }

    handleRegisterFailed = (_) => {
        this.forceUpdateNestedComponent();
        this.setError(ERROR_TYPE.CANNOT_CREATE_USER);
    }

    handleToggleRegistrationView = (event) => {
        event.preventDefault();
        const { registrationView } = this.state;
        this.setState({ registrationView: !registrationView });
    }

    render() {
        const { registrationView } = this.state;
        return (
            <div className="user-login">
                {registrationView
                    ? this.renderRegistrationView()
                    : this.renderLoginView()
                }
            </div>
        );
    }

    renderError(error) {
        return <p className="error-message">{error}</p>;
    }

    renderLinkRegister() {
        return (
            <p className="link-register-login">
                Nemáte účet? <a href="" onClick={this.handleToggleRegistrationView}>Zaregistrujte se</a>
            </p>
        );
    }

    renderLinkLogin() {
        return (
            <p className="link-register-login">
                Máte účet? <a href="" onClick={this.handleToggleRegistrationView}>Přihlašte se</a>
            </p>
        );
    }

    renderLoginView() {
        const { error } = this.state;
        return (
            <Fragment>
                {this.renderLinkRegister()}
                <Login onSubmit={this.handleLoginSubmit}/>
                {error && this.renderError(error)}
            </Fragment>
        );
    }

    renderRegistrationView() {
        const { error } = this.state;
        return (
            <Fragment>
                {this.renderLinkLogin()}
                <Register onSubmit={this.handleRegisterSubmit}/>
                {error && this.renderError(error)}
            </Fragment>
        );
    }

    encodeLoginData(securityImageIndex, knockCodeData) {
        return window.btoa(JSON.stringify({
            salt: Math.random(),
            ...knockCodeData,
            securityImageIndex,
            timestamp: new Date().getTime()
        }));
    }

    forceUpdateNestedComponent() {
        const { registrationView } = this.state;

        this.setState({ registrationView: !registrationView });
        this.setState({ registrationView });
    }

    clearError = () => {
        clearTimeout(this.errorTimeout);
        this.errorTimeout = null;
        this.setState({ error: null });
    }

    setError(type) {
        switch (type) {
            case ERROR_TYPE.USER_NOT_FOUND:
                this.setState({ error: 'Uživatel nenalezen.' });
                break;
            case ERROR_TYPE.CANNOT_CREATE_USER:
                this.setState({ error: 'Chyba při vytváření uživatele.' });
                break;
            case ERROR_TYPE.REQUEST_FAILED:
                this.setState({ error: 'Chyba při zpracování požadavku. Zkuste to prosím později.' });
                break;
        }

        if (this.errorTimeout !== null) {
            clearTimeout(this.errorTimeout);
        }

        this.errorTimeout = setTimeout(this.clearError, ERROR_TIMEOUT);
    }

};