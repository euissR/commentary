source("0 data.R")
needs(lubridate, forcats, sf)

crs <- "+proj=robin"

# trade timeline ----------------------------------------------------------

trade_tl <- read_excel("data/Data_GS US scrolly 2026.xlsx", sheet = "EU US trade negotiations") %>%
  select(1, 2) %>%
  mutate(date = as.Date(Date)) %>%
  select(-Date) %>%
  print()

# timeline ------------------------------------------------------------------

trade_tl %>%
  ggplot() +
  aes(0, date) +
  geom_point() +
  geom_text_euiss(aes(label = paste0("  ", Event))) +
  scale_y_date(date_breaks = "month",
               date_labels = format("%b")) +
  theme(axis.text.x = element_blank())
ggsave_euiss("img/3 trade_tl.jpg",
             publication = "brief",
             w = "full")

trade_tl %>% 
  rename(event = Event) %>% 
  write_csv("web/trade_tl.csv")

# trade volume ----------------------------------------------------------

trade_vol <- read_excel("data/Data_GS US scrolly 2026.xlsx", 
                        sheet = "EU-US trade 17-25",
                        skip = 11) %>%
  rename(total = 10) %>% 
  mutate(date = ymd(paste0(MONTH, "-15")),
         total = total / 1000) %>%
  print()

trade_vol_long <- trade_vol %>% 
  select(-total, -MONTH) %>% 
  pivot_longer(1:8) %>%
  print()

trade_vol_long %>% 
  mutate(name = case_match(
    name,
    "Other manufactured goods" ~ "Manufactured goods",
    .default = name
  ),
  value = value / 1000) %>% 
  group_by(date, name) %>% 
  reframe(value = sum(value, na.rm = TRUE)) %>% 
  # print()
  write_csv("web/trade_vol_long.csv")

# timeseries ------------------------------------------------------------------

trade_vol %>%
  ggplot() +
  aes(date, total) +
  geom_area_euiss() +
  geom_text_euiss(data = . %>% 
                    filter(total == max(total)),
                  aes(label = date)) +
  labs(title = "US-EU trade volume, € billion")
ggsave_euiss("img/3 trade_vol.jpg",
             publication = "brief",
             w = "full",
             h = .5)

trade_vol_long %>%
  ggplot() +
  aes(date, value) +
  x_axis_euiss() +
  geom_col(aes(fill = name)) +
  geom_text_euiss(data = . %>% 
                    filter(date == max(date)),
                  aes(label = paste0("  ", name)),
                  position = position_stack(vjust = 0.5)) +
  scale_x_date(limits = c(dmy("01-01-2017"), dmy("15-06-2027")),
               expand = c(0, 0)) +
  scale_fill_manual(values = pal_seq_g_euiss(8)) +
  labs(title = "US-EU trade volume, € billion")
ggsave_euiss("img/3 trade_vol_long.jpg",
             publication = "brief",
             w = "full",
             h = .5)

# trade deals ----------------------------------------------------------

trade <- read_excel("data/Data_GS US scrolly 2026.xlsx",
                    sheet = "Trade deals",
                    skip = 1) %>%
  pivot_longer(5:18) %>%
  mutate(Date = as.Date(Date)) %>%
  group_by(Country, Title) %>%
  mutate(id = row_number()) %>%
  ungroup() %>%
  mutate(
    type = case_when(
      id %in% c(1, 2, 3, 4, 5, 6, 7) ~ "Tariff and market access",
      # id %in% c(6, 7) ~ "Standards",
      id %in% c(8, 9, 10, 11) ~ "Economic security",
      id %in% c(12, 13, 14) ~ "Buy/invest American",
    )
  ) %>%
  filter(value != 0) %>%
  select(-id) %>% 
  rowid_to_column("id") %>% 
  print()

trade_sf <- trade %>%
  # join for liechtenstein and EU
  mutate(
    country = case_when(
      # Country == "European Union" ~ "Belgium",
      Country == "Lichtenstein" ~ "Liechtenstein",
      .default = Country
    )
  ) %>%
  euiss_left_join(euiss_gisco() %>% 
                    select(NAME_ENGL, ISO3_CODE), 
                  country = "country") %>%
  select(-c(Text, value, Country, country, ISO3_CODE)) %>%
  rename(country = NAME_ENGL) %>% 
  drop_na(country) %>% 
  print()

# replace EU geometry with entire EU
trade_sf$geometry[trade_sf$country == "European Union"] <-
  euiss_gisco() %>% 
  filter(EU_STAT == "T") %>% 
  select(NAME_ENGL, ISO3_CODE) %>% 
  st_union()

# matrix ------------------------------------------------------------------

trade_sf %>%
  ggplot() +
  aes(country, reorder(name, type)) +
  geom_point(aes(col = type)) +
  scale_x_discrete(position = "top") +
  scale_y_discrete(expand = c(0.01, 0.01)) +
  theme(axis.text.x = element_text(angle = 45, hjust = 0))
ggsave_euiss("img/3 trade.jpg",
             publication = "brief",
             w = "full",
             h = .5)

# map ---------------------------------------------------------------------

trade_sf %>% 
  ggplot() + 
  geom_sf(data = euiss_gisco(), 
          fill = NA) +
  geom_sf(aes(fill = type)) +
  coord_sf(crs = crs, datum = NA) +
  labs(title = "US trade deals by type", fill = NULL)
ggsave_euiss("img/3 trade_sf.jpg",
             publication = "brief",
             w = "full",
             h = .5)

write_csv(trade, "web/trade.csv")
st_write(trade_sf, "web/trade_sf.geojson", delete_dsn = TRUE)
