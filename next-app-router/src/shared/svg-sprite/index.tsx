export function SvgSprite() {
	return (
		<svg
			className="👻"
			xmlns="http://www.w3.org/2000/svg"
			xmlnsXlink="http://www.w3.org/1999/xlink"
		>
			<symbol id="loading" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
					opacity=".25"
				/>
				<path
					fill="currentColor"
					d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
				/>
			</symbol>

			<symbol id="close" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
				/>
			</symbol>

			<symbol id="translate" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="m12.87 15.07-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7 1.62-4.33L19.12 17h-3.24z"
				/>
			</symbol>

			<symbol id="notification" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M12 22c1.1 0 2-.9 2-2h-4a2 2 0 0 0 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
				/>
			</symbol>

			<symbol id="check-circle" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
				/>
			</symbol>

			<symbol id="error" viewBox="0 0 24 24">
				<path
					fill="currentColor"
					d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
				/>
			</symbol>

			{/* Flags; Source https://flagicons.lipis.dev */}
			<symbol id="flag-german" viewBox="0 0 640 480">
				<path fill="#ffce00" d="M0 320h640v160H0z" />
				<path fill="#000001" d="M0 0h640v160H0z" />
				<path fill="red" d="M0 160h640v160H0z" />
			</symbol>
			<symbol id="flag-english" viewBox="0 0 640 480">
				<path fill="#bd3d44" d="M0 0h640v480H0" />
				<path
					stroke="#fff"
					strokeWidth="37"
					d="M0 55.3h640M0 129h640M0 203h640M0 277h640M0 351h640M0 425h640"
				/>
				<path fill="#192f5d" d="M0 0h364.8v258.5H0" />
				<marker id="us-a" markerHeight="30" markerWidth="30">
					<path fill="#fff" d="m14 0 9 27L0 10h28L5 27z" />
				</marker>
				<path
					fill="none"
					markerMid="url(#us-a)"
					d="m0 0 16 11h61 61 61 61 60L47 37h61 61 60 61L16 63h61 61 61 61 60L47 89h61 61 60 61L16 115h61 61 61 61 60L47 141h61 61 60 61L16 166h61 61 61 61 60L47 192h61 61 60 61L16 218h61 61 61 61 60z"
				/>
			</symbol>
		</svg>
	);
}
