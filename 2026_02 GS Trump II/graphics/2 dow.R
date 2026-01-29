source("0 data.R")

# read ----------------------------------------------------------

obbb <- read_excel("data/DoW.xlsx",
                  sheet = "OBBB") %>% 
  print()

dow <- read_excel("data/DoW.xlsx",
                  sheet = "DoW budget") %>% 
  print()

fy <- read_excel("data/DoW.xlsx",
                  sheet = "FY26 Budget request") %>% 
  print()

