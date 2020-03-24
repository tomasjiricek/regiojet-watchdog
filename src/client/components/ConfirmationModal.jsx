import React, { Component } from 'react';
import { Button, Modal as BSModal } from 'react-bootstrap';

export default class Modal extends Component {
    handleCancel = (event) => {
        event.preventDefault();
        this.props.onCancel();
    }

    handleSubmit = (event) => {
        event.preventDefault();
        this.props.onSubmit();
    }

    render() {
        return (
            <BSModal.Dialog className="confirmation-dialog">
                {this.renderModalHeader()}
                {this.renderModalBody()}
            </BSModal.Dialog>
        );
    }

    renderModalHeader() {
        const { title } = this.props;

        return (
            <BSModal.Header>
                <BSModal.Title>{title}</BSModal.Title>
            </BSModal.Header>
        );
    }
s
    renderModalBody() {
        const { buttonLabelNo, buttonLabelYes, text } = this.props;

        return (
            <BSModal.Body>
                <p>{text}</p>
                <div className="buttons">
                    <Button className="yes" bsStyle="primary" onClick={this.handleSubmit}>{buttonLabelYes}</Button>
                    <Button className="no" bsStyle="default" onClick={this.handleCancel}>{buttonLabelNo}</Button>
                </div>
            </BSModal.Body>
        );
    }
}
