import React, { Component } from 'react';

import './securityImages.css';

const IMAGES_COUNT_ROW = 17;
const IMAGES_ROWS = 2;
const IMAGE_SIZE = {
    width: 85,
    height: 50
};

export default class SecurityImages extends Component {
    render() {
        return (
            <div className="security-images">
                {this.renderImages()}
            </div>
        );
    }

    renderImages() {
        const images = [];
        const { height, width } = IMAGE_SIZE;
        for (let i = 0, r = 0; r < IMAGES_ROWS; i++) {
            if (i === IMAGES_COUNT_ROW) {
                i = 0;
                r++;
            }
            if (r === IMAGES_ROWS) {
                break;
            }
            images.push(
                <div
                    key={`r${r}c${i}`}
                    className="security-image"
                    style={{ backgroundPosition: `${i * width}px ${r * height}px` }}
                />
            );
        }
        return images;
    }
}