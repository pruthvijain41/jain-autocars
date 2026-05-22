import React from 'react';

// Hidden honeypot field. Bots that fill out all form inputs will fill this too;
// real users never see it. Submit handlers must read its value and abort if non-empty.
const Honeypot = ({ value, onChange }) => (
    <div
        aria-hidden="true"
        style={{
            position: 'absolute',
            left: '-10000px',
            top: 'auto',
            width: 1,
            height: 1,
            overflow: 'hidden',
        }}
    >
        <label htmlFor="hp-website">Website</label>
        <input
            type="text"
            id="hp-website"
            name="website"
            tabIndex="-1"
            autoComplete="off"
            value={value}
            onChange={onChange}
        />
    </div>
);

export default Honeypot;
