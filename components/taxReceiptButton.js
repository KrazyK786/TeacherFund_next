/* global fetch */
import React, { useState, useEffect } from 'react'
import { Menu, MenuButton, MenuItem, MenuList } from '@chakra-ui/core'
import { getCurrentYear, formatDateAsYYYYMMDD, isFutureDate } from '../utils/date.utils'
import { formatQueryParams } from '../utils/formatting'
import { PDFDownloadLink } from '@react-pdf/renderer'
import TaxReceiptDocument from '../components/taxReceiptDocument'

const TaxReceiptButtonMenu = (props) => (
  props.taxYears && props.taxYears.length > 1
    ? <Menu>
      <MenuButton className='ttu btn-primary tf-lato b tc pa3 w-50 m-auto br-pill pointer'>
      Get Tax Receipt
      </MenuButton>
      <MenuList>
        {props.taxYears.map(year => (
          <MenuItem onClick={() => props.selectTaxYear(year)} key={year}>
            {year}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
    : <button
      className='ttu btn-primary tf-lato b tc pa3 w-50 m-auto br-pill pointer'
      onClick={() => props.selectTaxYear(props.selectedTaxYear)}
    >
        Get Tax Receipt
    </button>
)

const TaxReceiptButton = () => {
  const [donationsLoading, setdonationsLoading] = useState(false)
  const [userDonations, setUserDonations] = useState(null)
  const [donationUser, setDonationUser] = useState(null)
  const [showDownloadLink, setShowDownloadLink] = useState(false)
  const [taxYears, setTaxYears] = useState(null)
  const [selectedTaxYear, setSelectedTaxYear] = useState(null)

  const updateTaxReceiptButton = () => {
    const currentYear = getCurrentYear()
    const years = [currentYear]
    const taxDeadline = new Date(currentYear, 4, 15)
    const isBeforeTaxDeadline = isFutureDate(taxDeadline)

    if (isBeforeTaxDeadline) {
      years.push(currentYear - 1)
    } else {
      setSelectedTaxYear(currentYear)
    }

    setTaxYears(years)
    setShowDownloadLink(false)
  }

  useEffect(() => {
    updateTaxReceiptButton()
  }, [])

  const getUserDonations = async (year) => {
    const params = {
      start: formatDateAsYYYYMMDD(new Date(year, 0, 1)),
      end: formatDateAsYYYYMMDD(new Date(year, 11, 31))
    }

    try {
      setdonationsLoading(true)
      const resStream = await fetch(`/api/user-donations?${formatQueryParams(params)}`)
      const res = await resStream.json()

      if (res && res.data) {
        const { transactions, user } = res.data
        setUserDonations(transactions)
        setDonationUser(user)
        setShowDownloadLink(true)
      }
    } catch (e) {
    } finally {
      setdonationsLoading(false)
    }
  }

  const handleSelectTaxYear = (year) => {
    setSelectedTaxYear(year)
    getUserDonations(year)
  }

  const getSaveFileName = () => {
    return `${selectedTaxYear}-tax-receipt-TF`
  }

  return (
    <div>
      {donationsLoading
        ? <div className='white no-underline pa3 db ttu br-pill tf-lato b v-mid bg-tf-gray w-50 m-auto tc'>Loading...</div>
        : showDownloadLink
          ? <PDFDownloadLink
            className='db ttu btn-primary tf-lato b tc w-50 m-auto pa3 br-pill pointer'
            document={<TaxReceiptDocument transactions={userDonations} year={selectedTaxYear} user={donationUser} />}
            fileName={getSaveFileName()}
            onClick={() => setShowDownloadLink(false)}
          >
            {({ loading }) => (loading ? 'Preparing Document...' : 'Download Tax Receipt')}
          </PDFDownloadLink>
          : <TaxReceiptButtonMenu taxYears={taxYears} selectedTaxYear={selectedTaxYear} selectTaxYear={(year) => handleSelectTaxYear(year)} />
      }
    </div>
  )
}

export default TaxReceiptButton
