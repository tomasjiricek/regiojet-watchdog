import React, { Component, Fragment } from 'react';
import Login from './Login';
import request from '../../../utils/request';
import Register from './Register';

export default class UserLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
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
            res.json().then((data) => {
                this.handleLoginFailed(data);
            });
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
            res.json().then((data) => {
                this.handleRegisterFailed(data);
            });
        });
    }

    handleLoginSuccess = (data) => {
        this.props.onLogIn(data);
    }

    handleLoginFailed = (data) => {

    }

    handleRegisterSuccess = (data) => {
        this.props.onRegister(data);
    }

    handleRegisterFailed = (data) => {

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

    renderLoginView() {
        return (
            <Fragment>
                <Login onSubmit={this.handleLoginSubmit}/>
                <p>Nemáte účet? <a href="" onClick={this.handleToggleRegistrationView}>Zaregistrujte se</a></p>
            </Fragment>
        );
    }

    renderRegistrationView() {
        return (
            <Fragment>
                <Register onSubmit={this.handleRegisterSubmit}/>
                <p>Máte účet? <a href="" onClick={this.handleToggleRegistrationView}>Přihlašte se</a></p>
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
};