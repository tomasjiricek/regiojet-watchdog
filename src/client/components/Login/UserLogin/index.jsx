import React, { Component } from 'react';
import Login from './Login';
import request from '../../../utils/request';
import Register from './Register';

export default class UserLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    handleLoginSubmit = (securityImageIndex, knockCodeData) => {
        const encodedData = this.encodeLoginData(securityImageIndex, knockCodeData);
        const req = request('/api/user-login');
        const body = JSON.stringify({ token: encodedData });
        req.usePost();
        req.send({ body }).then((data) => {
            if (data.status === 200) {
                this.handleLoginSuccess(data);
                return;
            }
            this.handleLoginFailed(data);
        });
    }

    handleRegisterSubmit = (securityImageIndex, knockCodeData) => {
        const encodedData = this.encodeLoginData(securityImageIndex, knockCodeData);
        const req = request('/api/user-register');
        const body = JSON.stringify({ token: encodedData });
        req.usePost();
        req.send({ body }).then((data) => {
            if (data.status === 200) {
                this.handleRegisterSuccess(data);
                return;
            }
            this.handleRegisterFailed(data);
        });
    }

    handleLoginSuccess = (data) => {

    }

    handleLoginFailed = (data) => {

    }

    handleRegisterSuccess = (data) => {

    }

    handleRegisterFailed = (data) => {

    }

    render() {
        return (
            <div className="user-login">
                <Login onSubmit={this.handleLoginSubmit}/>
                <Register onSubmit={this.handleRegisterSubmit}/>
            </div>
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