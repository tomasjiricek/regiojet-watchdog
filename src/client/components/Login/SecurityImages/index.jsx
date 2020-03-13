import React, { Component } from 'react';

import './securityImages.css';

const IMAGES_COUNT = 34;
const IMAGES_COLUMNS_COUNT = 17;
const IMAGE_SIZE = {
    width: 85,
    height: 50
};

const imagesRowsCount = Math.ceil(IMAGES_COUNT / IMAGES_COLUMNS_COUNT);

export default class SecurityImages extends Component {
    handleImageClick = (index) => {
        this.props.onSubmit(index);
    }
    render() {
        return (
            <div className="security-images">
                {this.renderImages()}
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

        return (
            <div
                key={`r${row}c${col}`}
                className="security-image"
                style={{ backgroundPosition: `${col * width}px ${row * height}px` }}
                onClick={this.handleImageClick.bind(this, index)}
            />
        );
    }
}