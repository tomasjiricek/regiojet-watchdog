import React, { Component } from 'react';

const REQUIRED_SEQUENCE_LENGTH = 2;

export default class Register extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedImages: [],
            knockCodeGridSize: 0,
            knockCodeSequences: []
        };
    }

    onImageSubmit = (imageIndex) => {
        const { selectedImages, submitted } = this.state;

        if (imageIndex === -1 || submitted || selectedImages.length >= REQUIRED_SEQUENCE_LENGTH) {
            return;
        }

        selectedImages.push(imageIndex);
        this.setState({ selectedImages });
    }

    onKnockCodeSequenceSubmit = (sequence) => {
        const { knockCodeSequences, submitted } = this.state;

        if (sequence.length === 0 || submitted) {
            return;
        }

        if (knockCodeSequences.length >= REQUIRED_SEQUENCE_LENGTH) {
            this.onImageSubmit();
            this.setState({ submitted: true });
            return;
        }

        knockCodeSequences.push(sequence);
        this.setState({ knockCodeSequences });
    }

    render() {
        const { selectedImages } = this.state;
        return (
            <div className="register">
                {selectedImages.length < REQUIRED_SEQUENCE_LENGTH
                    ? this.renderSecurityImages()
                    : this.renderKnockCodeGrid()
                }
            </div>
        );
    }
};