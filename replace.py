import csv
import os

# Define the input and output file names
input_file = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\indices.csv"
temp_file = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\indices_edited.csv"

with open(input_file, mode='r', newline='', encoding='utf-8') as infile, \
        open(temp_file, mode='w', newline='', encoding='utf-8') as outfile:

    # CSV reader and writer
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    # Go through each row
    for row in reader:
        # Replace strings in the header row
        if reader.line_num == 1:
            row = [header.replace("Date/Time", "data_date").replace("Ticker", "ticker") for header in row]
        # Write the modified row to the temporary file
        writer.writerow(row)

# Remove the original file
os.remove(input_file)
# Rename the temporary file to the name of the original file
os.rename(temp_file, input_file)

input_file = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\tickers.csv"
temp_file = "C:\\Users\\Administrator\\Documents\\Github\\kangritel_bot\\tickers_edited.csv"

with open(input_file, mode='r', newline='', encoding='utf-8') as infile, \
        open(temp_file, mode='w', newline='', encoding='utf-8') as outfile:

    # CSV reader and writer
    reader = csv.reader(infile)
    writer = csv.writer(outfile)

    # Go through each row
    for row in reader:
        # Replace strings in the header row
        if reader.line_num == 1:
            row = [header.replace("Date/Time", "data_date").replace("Ticker", "ticker") for header in row]
        # Write the modified row to the temporary file
        writer.writerow(row)

# Remove the original file
os.remove(input_file)
# Rename the temporary file to the name of the original file
os.rename(temp_file, input_file)