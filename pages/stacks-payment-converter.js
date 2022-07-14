import styles from './StacksPayment.module.css';
import CloseIcon from '../public/images/close.svg';
import StacksLogo from '../public/images/stacks-logo.svg';
import DropdownIcon from '../public/images/dropdown.svg';
import Calendar from 'react-calendar';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

const StacksConverter = () => {
	const [value, onChange] = useState(new Date());
	const [show, setShow] = useState(true);
	const [weekAverageStxPrice, setWeekAverageStxPrice] = useState(0);
	const [inputAmount, setInputAmount] = useState(0);
	const [convertedStxAmount, setConvertedStxAmount] = useState(0);
	const [convertedUsdAmount, setConvertedUsdAmount] = useState(0);
	const [copyToClipboard, setCopyToClipboard] = useState(false);
	const [currencyDropdown, setCurrencyDropdown] = useState();

	let pastSevenDays = new Date(value.getTime() - 7 * 24 * 60 * 60 * 1000);
	let unixDateSevenDaysAgo = Math.floor(pastSevenDays.getTime() / 1000);
	let unixDateSelected = Math.floor(value.getTime() / 1000);

	const copyAmount = async () => {
		let copyText = await document.getElementById('stxNumber').innerText;
		await navigator.clipboard.writeText(copyText).then(
			() => setCopyToClipboard(true),
			setTimeout(() => {
				setCopyToClipboard(false);
			}, 700)
		);
	};

	const getStxPrice = useCallback(
		async (
			userInput = 0,
			userChosenDate = unixDateSelected,
			userDateSevenDaysAgo = unixDateSevenDaysAgo
		) => {
			let response = await fetch(
				`https://api.coingecko.com/api/v3/coins/blockstack/market_chart/range?vs_currency=usd&from=${userDateSevenDaysAgo}&to=${userChosenDate}`
			);
			let data = await response.json();

			data = data.prices;

			let sum = 0;

			data = data.map((array) => {
				sum += parseFloat(array[1]);
				return array[1];
			});
			let average = sum / data.length;
			setWeekAverageStxPrice(average);
			setConvertedStxAmount(userInput * average);
			setConvertedUsdAmount(userInput / average);
		},
		[]
	);

	useEffect(() => {
		getStxPrice().catch(console.error);
	}, [getStxPrice]);

	useEffect(() => {
		setShow(false);
	}, [value]);

	return (
		<div>
			<Link href="/">
				<a>
					<div className={styles.close}>
						<p>
							<CloseIcon />
							Close
						</p>
						<span></span>
					</div>
				</a>
			</Link>
			<div className={styles.stxPaymentWrapper}>
				<h1>STX Payment Converter</h1>
				<p className={styles.descriptor}>
					A simple widget for verifying the amount of STX you receive for payments. All conversions
					are based on a 7-day trailing average.
				</p>
				<div className={styles.paymentCalculatorWrapper}>
					<div className={styles.dropdownWrapper}>
						<label for="selectCurrency">A. Select Currency (STX or USD)</label>
						<select name="selectCurrency" onChange={(e) => setCurrencyDropdown(e.target.value)}>
							<option value="" disabled selected>
								Drop down...
							</option>
							<option value="stx">STX</option>
							<option value="usd">USD</option>
						</select>
					</div>
					<div className={styles.dropdownWrapper}>
						<label for="amountReceived">C. Input Amount Received</label>
						<input
							name="amountReceived"
							type="number"
							placeholder="Type here..."
							onWheel={(e) => e.target.blur()}
							onChange={(e) => setInputAmount(e.target.value)}
						/>
					</div>
					<div className={styles.calendarDropdownWrapper}>
						<h2 for="selectDate">B. Select Date Payment Issued</h2>
						<button
							className={styles.calendarDropdownButton}
							onClick={() => {
								setShow(!show);
							}}
						>
							<p>Drop Down...</p>
							<DropdownIcon />
						</button>
						<div>
							<Calendar
								className={show ? styles.show : styles.hide}
								onChange={onChange}
								value={value}
							/>
						</div>
					</div>
					<div className={styles.dropdownWrapper}>
						<button
							onClick={() => getStxPrice(inputAmount, unixDateSelected, unixDateSevenDaysAgo)}
							className={styles.converterButton}
						>
							Click to Convert
						</button>
					</div>
					<div className={styles.dropdownWrapper}>
						<div>
							<p>Date Range</p>
							<p>
								{pastSevenDays
									.toLocaleString('default', {
										month: 'long',
										day: '2-digit',
										year: '2-digit'
									})
									.replace(' ', '-')
									.replace(',', '-')
									.replace(' ', '')}
								{` to `}
								{value
									.toLocaleString('default', {
										month: 'long',
										day: '2-digit',
										year: '2-digit'
									})
									.replace(' ', '-')
									.replace(',', '-')
									.replace(' ', '')}
							</p>
							<p>in 7-day trailing average</p>
						</div>
					</div>
					<div className={styles.dropdownWrapper}>
						<div className={styles.stxAmount}>
							<p>{currencyDropdown === 'stx' ? 'USD' : 'STX'}</p>
							<p id="stxNumber">
								{currencyDropdown === 'stx'
									? convertedStxAmount.toFixed(2)
									: convertedUsdAmount.toFixed(2)}
							</p>
							<p>
								1 {currencyDropdown === 'stx' ? 'STX' : 'USD'} ={' '}
								{currencyDropdown === 'stx'
									? weekAverageStxPrice.toFixed(3).toLocaleString()
									: (1 / weekAverageStxPrice).toFixed(3).toLocaleString()}{' '}
								{currencyDropdown === 'stx' ? 'USD' : 'STX'}
							</p>
						</div>
					</div>
					<div className={styles.dropdownWrapper}></div>
					<div className={styles.dropdownWrapper}>
						<button className={styles.clipboardButton} onClick={copyAmount}>
							{copyToClipboard ? 'Copied' : 'Copy to Clipboard'}
						</button>
					</div>
				</div>
			</div>

			<StacksLogo className={styles.stacksSVG} />
		</div>
	);
};

export default StacksConverter;
