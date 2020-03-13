import React, { Component } from 'react';
import Login from './Login';
import request from '../../../utils/request';

export default class UserLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    handleLoginSubmit = (securityImageIndex, knockCodeData) => {
        const encodedData = window.btoa(JSON.stringify({
            salt: Math.random(),
            ...knockCodeData,
            securityImageIndex,
            timestamp: new Date().getTime()
        }));
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

    handleLoginSuccess = (data) => {

    }

    handleLoginFailed = (data) => {

    }

    render() {
        return (
            <div className="user-login">
                <Login onSubmit={this.handleLoginSubmit}/>
            </div>
        );
    }
};