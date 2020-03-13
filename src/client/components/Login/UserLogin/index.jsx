import React, { Component } from 'react';
import Login from './Login';

export default class UserLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {

        };
    }

    handleLoginSubmit = (securityImageIndex, knockCode) => {
        this.props.onLoginSubmit(securityImageIndex, knockCode);
    }

    render() {
        return (
            <div className="user-login">
                <Login onSubmit={this.handleLoginSubmit}/>
            </div>
        );
    }
};