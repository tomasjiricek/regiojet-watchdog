import React, { Component } from 'react';
import { Button, Form, FormControl, Modal, FormGroup } from 'react-bootstrap';
import request from '../../../utils/request';

const AUTH_STATUS = {
    AUTHORIZED: 'authorized',
    AUTHORIZING: 'authorizing',
    FAILED: 'failed',
    UNAUTHORIZED: 'unauthorized',
}

export default class MasterLogin extends Component {
    constructor(props) {
        super(props);
        this.state = {
            status: AUTH_STATUS.UNAUTHORIZED,
            password: '',
        };
    }

    handleAuthorized = (_) => {
        this.setState({ status: AUTH_STATUS.AUTHORIZED });
        this.props.onAuthorize();
    }

    handleFailed = (_) => {
        this.setState({ password: '', status: AUTH_STATUS.FAILED });
    }

    handlePasswordChange = (event) => {
        this.setState({ password: event.target.value });
    }

    handlePasswordSubmit = (event) => {
        event.preventDefault();
        if (this.isAuthorizingOrAuthorized()) {
            return;
        }

        this.setState({ status: AUTH_STATUS.AUTHORIZING });
        const { password } = this.state;
        const { deviceId } = this.props;
        const body = JSON.stringify({ deviceId, password });

        request('/api/master-login')
            .usePost()
            .send({ body })
            .then((data) => {
                if (data.status === 200) {
                    this.handleAuthorized(data);
                    return;
                }
                this.handleFailed(data);
            });
    }

    isAuthorizingOrAuthorized() {
        const { status } = this.state;
        return status === AUTH_STATUS.AUTHORIZING || status === AUTH_STATUS.AUTHORIZED;
    }

    hasAuthorizationFailed() {
        return this.state.status === AUTH_STATUS.FAILED;
    }

    render() {
        return (
            <Modal.Dialog>
                {this.renderModalHeader()}
                {this.renderModalBody()}
                {this.renderModalFooter()}
            </Modal.Dialog>
        );
    }

    renderModalHeader() {
        if (status === AUTH_STATUS.AUTHORIZING) {
            return <Modal.Header><Modal.Title>Ověřování přístupu...</Modal.Title></Modal.Header>;
        }

        if (status === AUTH_STATUS.FAILED) {
            return <Modal.Header><Modal.Title>Nepodařilo se autorizovat. Zkuste to prosím znovu.</Modal.Title></Modal.Header>;
        }

        if (status === AUTH_STATUS.AUTHORIZED) {
            return <Modal.Header><Modal.Title>Úspěšně ověřeno.</Modal.Title></Modal.Header>;
        }

        return  <Modal.Header><Modal.Title>Zadejte heslo pro přístup</Modal.Title></Modal.Header>;
    }

    renderModalBody() {
        const { password } = this.state;
        const isDisabled = this.isAuthorizingOrAuthorized();
        const inputBsStyle = this.hasAuthorizationFailed() && password.length === 0 ? 'error' : 'default';
        return (
            <Modal.Body>
                <Form onSubmit={this.handlePasswordSubmit}>
                    <FormGroup controlId="master-password">
                        <FormControl
                            bsStyle={inputBsStyle}
                            placeholder="Heslo"
                            type="password"
                            value={this.state.password}
                            disabled={isDisabled}
                            onChange={this.handlePasswordChange}
                        />
                    </FormGroup>
                    <FormGroup controlId="master-password-submit">
                        <Button bsStyle="primary" disabled={isDisabled} onClick={this.handlePasswordSubmit}>Potvrdit</Button>
                    </FormGroup>
                </Form>
            </Modal.Body>
        );
    }

    renderModalFooter() {
        const { status } = this.state;

        if (status === AUTH_STATUS.AUTHORIZING) {
            return <Modal.Footer><span>Ověřování přístupu...</span></Modal.Footer>;
        }

        if (status === AUTH_STATUS.FAILED) {
            return <Modal.Footer><span>Nepodařilo se autorizovat. Zkuste to prosím znovu.</span></Modal.Footer>;
        }

        if (status === AUTH_STATUS.AUTHORIZED) {
            return <Modal.Footer><span>Úspěšně ověřeno.</span></Modal.Footer>;
        }

        return null;
    }
}
