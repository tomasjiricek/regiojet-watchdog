import React, { Component } from 'react';
import { Button, PageHeader } from 'react-bootstrap';

import './securityImages.css';

const IMAGES_COUNT = 34;
const IMAGES_COLUMNS_COUNT = 17;
const IMAGE_SIZE = {
    width: 85,
    height: 50
};

export default class SecurityImages extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedImageIndex: null
        };
    }

    handleImageClick = (selectedImageIndex, event) => {
        this.setState({ selectedImageIndex });
        event.preventDefault();
    }

    handleSubmit = () => {
        this.props.onSubmit(this.state.selectedImageIndex);
    }

    render() {
        return (
            <div className="security-images">
                <PageHeader>Vyberte bezpečnostní obrázek</PageHeader>
                {this.renderImages()}
                {this.renderSubmitButton()}
            </div>
        );
    }

    renderImages() {
        const images = [];

        for (let col = 0, row = 0, i = 0; i < IMAGES_COUNT; col++, i++) {
            if (col === IMAGES_COLUMNS_COUNT) {
                col = 0;
                row++;
            }

            images.push(this.renderImage(i, row, col));
        }

        return images;
    }

    renderImage(index, row, col) {
        const { height, width } = IMAGE_SIZE;
        const { selectedImageIndex } = this.state;
        const className = 'security-image' + (index === selectedImageIndex ? ' selected' : '');

        return (
            <a
                href=""
                key={`r${row}c${col}`}
                className={className}
                style={{ backgroundPosition: `${col * width}px ${row * height}px` }}
                onClick={this.handleImageClick.bind(this, index)}
            />
        );
    }

    renderSubmitButton() {
        const disabled = this.state.selectedImageIndex === null;
        return (
            <div className="security-image-submit">
                <Button bsStyle="primary" disabled={disabled} onClick={this.handleSubmit}>Potvrdit</Button>
            </div>
        );
    }
}