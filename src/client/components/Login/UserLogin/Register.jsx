import React, { Component } from 'react';
import { PageHeader } from 'react-bootstrap';
import SecurityImages from '../SecurityImages';
import KnockCode from '../KnockCode';
import { compare as arrayCompare } from '../../../utils/array';

const REQUIRED_SEQUENCE_LENGTH = 2;
const ERROR_MESSAGE_TIMEOUT = 6000;
const ERROR_TYPE = {
    IMAGE_DOES_NOT_MATCH: 1,
    KNOCK_CODE_DOES_NOT_MATCH: 2
};
export default class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            knockCodeConfirmed: false,
            knockCodeData: null,
            selectedImageConfirmed: false,
            selectedImageIndex: null,
            submitted: false
        };
    }

    handleImageSubmit = (index) => {
        const { selectedImageIndex, submitted } = this.state;

        if (index === null || submitted) {
            return;
        }

        if (selectedImageIndex !== null) {
            if (selectedImageIndex !== index) {
                this.setError(ERROR_TYPE.IMAGE_DOES_NOT_MATCH);
                return;
            }
            this.setState({ selectedImageConfirmed: true });
            return;
        }

        this.setState({ selectedImageIndex: index });
    }

    handleKnockCodeSubmit = (data) => {
        const { knockCodeData, submitted } = this.state;

        if (data === null || submitted) {
            return;
        }

        if (knockCodeData !== null) {
            if (!this.compareKnockCodeData(knockCodeData, data)) {
                this.setError(ERROR_TYPE.KNOCK_CODE_DOES_NOT_MATCH);
                return;
            }
            this.setState({ knockCodeConfirmed: true });
            this.submit();
            return;
        }
        this.setState({ knockCodeData: data });
    }

    render() {
        const { error, knockCodeData, knockCodeConfirmed, selectedImageIndex, selectedImageConfirmed } = this.state;
        const knockCodeTitle = knockCodeData !== null
            ? 'Potvrďte přihlašovací vzor'
            : 'Zadejte nový přihlašovací vzor';
        const securityImagesTitle = selectedImageIndex !== null
            ? 'Potvrďte bezpečnostní obrázek'
            : 'Zvolte si bezpečnostní obrázek';

        return (
            <div className="register">
                <PageHeader>Registrace</PageHeader>
                {!selectedImageConfirmed
                    ? <SecurityImages title={securityImagesTitle} onSubmit={this.handleImageSubmit}/>
                    : !knockCodeConfirmed
                        &&<KnockCode title={knockCodeTitle} onSubmit={this.handleKnockCodeSubmit}/>
                }
                { error !== null && this.renderError(error) }
            </div>
        );
    }

    renderError(error) {
        return <p className="error-message">{error}</p>;
    }

    clearError = () => {
        clearTimeout(this.errorTimeout);
        this.errorTimeout = null;
        this.setState({ error: null });
    }

    compareKnockCodeData(data1, data2) {
        return data1.size === data2.size && arrayCompare(data1.pattern, data2.pattern);
    }

    setError(type) {
        switch (type) {
            case ERROR_TYPE.KNOCK_CODE_DOES_NOT_MATCH:
                this.setState({ knockCodeData: null, error: 'Vzory se neshodují' });
                break;
            case ERROR_TYPE.IMAGE_DOES_NOT_MATCH:
                this.setState({ selectedImageIndex: null, error: 'Bezpečnostní obrázky se neshodují' });
                break;
        }

        if (this.errorTimeout !== null) {
            clearTimeout(this.errorTimeout);
        }

        this.errorTimeout = setTimeout(this.clearError, ERROR_MESSAGE_TIMEOUT);
    }

    submit() {
        const { knockCodeData, selectedImageIndex } = this.state;
        this.props.onSubmit(selectedImageIndex, knockCodeData);
        this.setState({ submitted: true });
    }
};