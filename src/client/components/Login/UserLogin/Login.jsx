import React, { Component } from 'react';
import { PageHeader } from 'react-bootstrap';

import KnockCode from '../KnockCode';
import SecurityImages from '../SecurityImages';

export default class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedImage: null,
            submitted: false
        };
    }

    handleImageSubmit = (imageIndex) => {
        this.setState({ selectedImage: imageIndex });
    }

    handleKnockCodeSubmit = (knockCodeData) => {
        if (this.state.submitted) {
            return;
        }

        this.submit(knockCodeData);
    }

    submit(knockCodeData) {
        this.props.onSubmit(this.state.selectedImage, knockCodeData);
        this.setState({ submitted: true });
    }

    render() {
        const { selectedImage, submitted } = this.state;

        if (submitted) {
            return <PageHeader>Přihlašování...</PageHeader>
        }

        return (
            <div className="login">
                <PageHeader>Přihlášení</PageHeader>
                {selectedImage === null
                    ? <SecurityImages title="Vyberte bezpečnostní obrázek" onSubmit={this.handleImageSubmit}/>
                    : <KnockCode title="Zadejte přihlašovací vzor" onSubmit={this.handleKnockCodeSubmit}/>
                }
            </div>
        );
    }
};