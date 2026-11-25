"""
Subject Integration: Microprocessors & Computer Architecture (MPCA)
Implements real embedded architecture concepts:
1. 24-bit Two's Complement signed decoding (HX711 24-bit ADC)
2. Bitwise shift-register serial conversion (SPI / 2-wire serial)
3. Endianness conversion (Big-Endian wire vs Little-Endian Xtensa CPU)
4. Hardware bus parity bit computation
"""

from typing import Any, Dict, List, Tuple

class MPCATools:
    """
    Demonstrable computer architecture routines directly applicable
    to the ESP32, HX711 ADC, and RFID-RC522 hardware.
    """

    @staticmethod
    def decode_hx711_24bit_twos_complement(raw_24bit_int: int) -> Dict[str, Any]:
        """
        The HX711 ADC transmits 24 clock pulses yielding a 24-bit two's complement integer.
        
        MPCA Theory:
        - Bit 23 (MSB): Sign bit (0 = positive, 1 = negative).
        - If Bit 23 == 1, value is negative. To sign-extend to 32/64-bit integer:
          value = raw_24bit - (1 << 24) = raw_24bit - 16777216
        - If Bit 23 == 0, value is positive.
        """
        # Ensure only 24 bits are evaluated
        masked_raw = raw_24bit_int & 0xFFFFFF
        is_negative = bool(masked_raw & 0x800000)  # Check MSB (Bit 23)

        if is_negative:
            signed_decimal = masked_raw - (1 << 24)
        else:
            signed_decimal = masked_raw

        binary_str = format(masked_raw, '024b')
        hex_str = f"0x{masked_raw:06X}"

        return {
            "raw_input_hex": hex_str,
            "raw_binary_24bit": binary_str,
            "sign_bit_msb": 1 if is_negative else 0,
            "is_negative": is_negative,
            "signed_decimal_value": signed_decimal,
            "explanation": (
                "MSB is 1 -> Negative number. Extended via: decimal = raw - (2^24)."
                if is_negative else
                "MSB is 0 -> Positive number. Direct binary-to-decimal magnitude."
            )
        }

    @staticmethod
    def simulate_serial_to_parallel_shift(bits: List[int]) -> Dict[str, Any]:
        """
        Simulates how ESP32 hardware shift register captures serial bitstream
        on each clock edge from HX711 DOUT or SPI MISO line.
        
        Formula on each clock pulse:
          register = (register << 1) | bit
        """
        register = 0
        cycle_log = []

        for cycle, bit in enumerate(bits, start=1):
            bit_val = 1 if bit else 0
            register = ((register << 1) | bit_val) & 0xFFFFFFFF
            cycle_log.append({
                "clock_cycle": cycle,
                "bit_in": bit_val,
                "register_state_hex": f"0x{register:X}",
                "register_state_bin": format(register, 'b')
            })

        return {
            "total_clock_cycles": len(bits),
            "final_parallel_value": register,
            "final_hex": f"0x{register:X}",
            "execution_trace": cycle_log
        }

    @staticmethod
    def analyze_rfid_endianness(hex_uid: str) -> Dict[str, Any]:
        """
        Demonstrates Endianness difference:
        - Big-Endian (Network / SPI wire order): Most significant byte transmitted first.
        - Little-Endian (ESP32 Xtensa LX6 architecture): Least significant byte stored at lowest address.
        """
        clean = hex_uid.replace(" ", "").replace(":", "").upper()
        # Parse into 2-character byte pairs
        bytes_list = [clean[i:i+2] for i in range(0, len(clean), 2)]
        
        big_endian_str = " ".join(bytes_list)
        little_endian_str = " ".join(reversed(bytes_list))
        
        # Calculate raw integer value in both formats
        raw_int_be = int(clean, 16)
        raw_int_le = int("".join(reversed(bytes_list)), 16)

        return {
            "original_hex_uid": clean,
            "byte_array": bytes_list,
            "big_endian_wire_order": big_endian_str,
            "big_endian_integer": raw_int_be,
            "little_endian_xtensa_order": little_endian_str,
            "little_endian_integer": raw_int_le,
            "academic_note": (
                "RFID RC522 transmits UID MSB-first over SPI (Big-Endian). "
                "ESP32's 32-bit Xtensa processor stores multi-byte integers in Little-Endian memory order."
            )
        }

    @staticmethod
    def calculate_parity(byte_val: int) -> Dict[str, Any]:
        """
        Computes Even and Odd Parity for a given byte using bitwise XOR.
        Demonstrates hardware communication integrity checks.
        """
        byte_masked = byte_val & 0xFF
        # Count number of set bits (popcount via XOR)
        count = bin(byte_masked).count('1')
        even_parity_bit = 0 if (count % 2 == 0) else 1
        odd_parity_bit = 1 if (count % 2 == 0) else 0

        return {
            "byte_hex": f"0x{byte_masked:02X}",
            "byte_binary": format(byte_masked, '08b'),
            "number_of_ones": count,
            "even_parity_bit": even_parity_bit,
            "odd_parity_bit": odd_parity_bit
        }
